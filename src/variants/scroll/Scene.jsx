import { useEffect, useRef } from 'react'

// ------------------------------------------------------------
//  Scroll-driven scenes
//  A <Scene> is a tall section whose content stays pinned to the
//  screen while you scroll through it. Its progress (0 → 1) is
//  written to the CSS variable --p, and CSS turns it into motion.
// ------------------------------------------------------------

const subscribers = new Set()
let frame = 0

function run() {
  frame = 0
  subscribers.forEach((fn) => fn())
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(run)
}

// Calls `fn` once per animation frame after a scroll or resize
export function useScrollTicker(fn) {
  const ref = useRef(fn)
  ref.current = fn

  useEffect(() => {
    const tick = () => ref.current()
    subscribers.add(tick)
    if (subscribers.size === 1) {
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule)
    }
    schedule()
    return () => {
      subscribers.delete(tick)
      if (subscribers.size === 0) {
        window.removeEventListener('scroll', schedule)
        window.removeEventListener('resize', schedule)
      }
    }
  }, [])
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))

// `length` is the scroll distance in screen heights.
// `title` animates from the middle of the screen to the top-left corner.
// Content that is taller/wider than the screen is panned while scrolling:
// mark it with className "cine-pan-y" or "cine-pan-x".
export function Scene({ id, label, length = 3, title, tag, className = '', onProgress, children }) {
  const ref = useRef()

  useScrollTicker(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const span = rect.height - window.innerHeight
    const p = span > 0 ? clamp01(-rect.top / span) : 1

    const panY = el.querySelector('.cine-pan-y')
    const panX = el.querySelector('.cine-pan-x')
    const overY = panY ? Math.max(0, panY.offsetHeight - panY.parentElement.clientHeight) : 0
    const overX = panX ? Math.max(0, panX.scrollWidth - panX.parentElement.clientWidth) : 0

    el.style.setProperty('--p', p.toFixed(4))
    el.style.setProperty('--ov-y', `${overY}px`)
    el.style.setProperty('--ov-x', `${overX}px`)
    onProgress?.(p)
  })

  return (
    <section
      ref={ref}
      id={id}
      data-label={label}
      className={`cine-scene ${className}`}
      style={{ height: `${length * 100}svh` }}
    >
      <div className="cine-sticky">
        {title && (
          <header className="cine-title">
            {tag && <span className="cine-title__tag">{tag}</span>}
            <h2>{title}</h2>
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

// Fades/slides an element in when the scene progress reaches `at`.
// `out` (optional) fades it out again from that point.
export function Reveal({ at = 0, len = 0.08, out, from = 'up', as: Tag = 'div', className = '', style, children, ...rest }) {
  return (
    <Tag
      className={`r r--${from} ${out != null ? 'r--out' : ''} ${className}`}
      style={{ '--at': at, '--len': len, '--out': out ?? 2, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
