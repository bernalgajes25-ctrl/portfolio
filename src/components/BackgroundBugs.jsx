import { useEffect, useRef, useState } from 'react'
import { BEETLE, INVADER, OCTOPUS, SQUID, drawSprite } from '../sprites.js'
import { sfx } from '../sound.js'

// Pixel bugs wandering behind the page. Click (or tap) one to squash it.
// They run away from the mouse.

const SCALE = 3 // one sprite pixel = 3 screen pixels
// How many bugs can be on screen at once, and how many there are at the start
const MAX_BUGS_DESKTOP = 16
const MAX_BUGS_MOBILE = 7
const START_BUGS = 10
const HIT_RADIUS = 30 // click this close to a bug's center = hit
const NEAR_RADIUS = 80 // closer than this but not a hit = "MISS"
const FLEE_RADIUS = 140
const TYPES = [INVADER, BEETLE, SQUID, OCTOPUS]
// Solid page elements that cover the bugs
const OPAQUE =
  '.card, .panel, .window, .map__card, .map__node, .world-map, .arcade, .navbar, .badge, .btn, .tag, .avatar__bubble, .toast, .bug-counter, img'

function readPalette() {
  const css = getComputedStyle(document.documentElement)
  const v = (name) => css.getPropertyValue(name).trim()
  return {
    bugs: [v('--accent-3'), v('--accent'), v('--accent-2'), v('--green'), v('--red')],
    text: v('--green'),
  }
}

function spawnBug(w, h, palette, anywhere = false) {
  const sprite = TYPES[Math.floor(Math.random() * TYPES.length)]
  const bw = sprite[0][0].length * SCALE
  const bh = sprite[0].length * SCALE
  let x
  let y
  if (anywhere) {
    x = Math.random() * (w - bw)
    y = Math.random() * (h - bh)
  } else {
    // enter from a random edge
    const edge = Math.floor(Math.random() * 4)
    x = edge === 1 ? w - bw : edge === 3 ? 0 : Math.random() * (w - bw)
    y = edge === 0 ? 0 : edge === 2 ? h - bh : Math.random() * (h - bh)
  }
  return {
    x,
    y,
    heading: Math.random() * Math.PI * 2,
    speed: 22 + Math.random() * 22,
    w: bw,
    h: bh,
    sprite,
    color: palette.bugs[Math.floor(Math.random() * palette.bugs.length)],
    frame: 0,
    frameTimer: Math.random() * 0.3,
    fleeing: false,
  }
}

export default function BackgroundBugs({ onKill }) {
  const canvasRef = useRef(null)
  const [kills, setKills] = useState(0)
  const onKillRef = useRef(onKill)
  onKillRef.current = onKill
  const [enabled] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const palette = readPalette()
    const pointer = { x: -9999, y: -9999 }
    const effects = [] // particles and "FIXED!" texts
    let bugs = []
    let killCount = 0
    let spawnTimer = 2
    let raf
    let last = performance.now()

    const maxBugs = () => (window.innerWidth < 640 ? MAX_BUGS_MOBILE : MAX_BUGS_DESKTOP)

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.imageSmoothingEnabled = false
    }
    resize()
    bugs = Array.from({ length: Math.min(START_BUGS, maxBugs()) }, () =>
      spawnBug(canvas.width, canvas.height, palette, true),
    )

    // A bug hidden behind a card, panel, etc. can't be clicked
    const isVisible = (b) => {
      const el = document.elementFromPoint(b.x + b.w / 2, b.y + b.h / 2)
      return !el || !el.closest(OPAQUE)
    }

    const nearestBug = (x, y) => {
      let best = null
      let bestDist = Infinity
      for (const b of bugs.filter(isVisible)) {
        const d = Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y)
        if (d < bestDist) {
          best = b
          bestDist = d
        }
      }
      return { bug: best, dist: bestDist }
    }

    const squash = (bug) => {
      bugs = bugs.filter((b) => b !== bug)
      const cx = bug.x + bug.w / 2
      const cy = bug.y + bug.h / 2
      for (let i = 0; i < 14; i++) {
        effects.push({
          kind: 'particle',
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 260,
          vy: (Math.random() - 0.5) * 260,
          life: 0.5,
          color: bug.color,
        })
      }
      effects.push({ kind: 'text', x: cx, y: cy - 10, vx: 0, vy: -40, life: 0.9, text: 'FIXED!' })
      sfx.explode()
      killCount += 1
      setKills(killCount)
      onKillRef.current?.(killCount)
    }

    const miss = (x, y) => {
      effects.push({ kind: 'text', x, y: y - 10, vx: 0, vy: -30, life: 0.6, text: 'MISS', miss: true })
      sfx.blip()
    }

    // Left click (or tap) to squash. Clicks on links, buttons, text fields
    // or the mini-game keep working as usual.
    const onPointerDown = (e) => {
      if (e.button !== 0) return
      if (e.target.closest('a, button, input, textarea, select, label, canvas, [role="button"]')) return
      const { bug, dist } = nearestBug(e.clientX, e.clientY)
      const radius = e.pointerType === 'mouse' ? HIT_RADIUS : HIT_RADIUS + 10
      if (bug && dist < radius) squash(bug)
      else if (bug && dist < NEAR_RADIUS && e.pointerType === 'mouse') miss(e.clientX, e.clientY)
    }

    const onPointerMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', resize)

    const update = (dt) => {
      const w = canvas.width
      const h = canvas.height

      spawnTimer -= dt
      if (spawnTimer <= 0) {
        if (bugs.length < maxBugs()) bugs.push(spawnBug(w, h, palette))
        spawnTimer = 1 + Math.random() * 1.5
      }

      for (const b of bugs) {
        const cx = b.x + b.w / 2
        const cy = b.y + b.h / 2
        const dx = cx - pointer.x
        const dy = cy - pointer.y
        b.fleeing = Math.hypot(dx, dy) < FLEE_RADIUS

        if (b.fleeing) {
          // turn away from the cursor
          const away = Math.atan2(dy, dx)
          let diff = away - b.heading
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          b.heading += diff * Math.min(1, dt * 6)
        } else {
          b.heading += (Math.random() - 0.5) * dt * 3 // wander
        }

        const speed = b.speed * (b.fleeing ? 3 : 1)
        b.x += Math.cos(b.heading) * speed * dt
        b.y += Math.sin(b.heading) * speed * dt

        // bounce off the screen edges
        if (b.x < 0 || b.x > w - b.w) {
          b.heading = Math.PI - b.heading
          b.x = Math.max(0, Math.min(w - b.w, b.x))
        }
        if (b.y < 0 || b.y > h - b.h) {
          b.heading = -b.heading
          b.y = Math.max(0, Math.min(h - b.h, b.y))
        }

        b.frameTimer += dt * (b.fleeing ? 3 : 1)
        if (b.frameTimer > 0.3) {
          b.frameTimer = 0
          b.frame ^= 1
        }
      }

      for (const e of effects) {
        e.x += e.vx * dt
        e.y += e.vy * dt
        e.life -= dt
      }
      for (let i = effects.length - 1; i >= 0; i--) if (effects[i].life <= 0) effects.splice(i, 1)
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const b of bugs) {
        ctx.globalAlpha = b.fleeing ? 0.85 : 0.45
        drawSprite(ctx, b.sprite[b.frame], Math.round(b.x), Math.round(b.y), b.color, SCALE)
      }
      for (const e of effects) {
        ctx.globalAlpha = Math.min(1, e.life * 2)
        if (e.kind === 'particle') {
          ctx.fillStyle = e.color
          ctx.fillRect(Math.round(e.x), Math.round(e.y), SCALE * 2, SCALE * 2)
        } else {
          ctx.fillStyle = e.miss ? palette.bugs[0] : palette.text
          ctx.font = '10px "Press Start 2P"'
          ctx.textAlign = 'center'
          ctx.fillText(e.text, Math.round(e.x), Math.round(e.y))
        }
      }
      ctx.globalAlpha = 1
    }

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      update(dt)
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', resize)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <canvas ref={canvasRef} className="bg-bugs" aria-hidden="true" />
      {kills > 0 && (
        <div className="bug-counter" aria-live="polite">
          Bugs fixed <strong>{String(kills).padStart(3, '0')}</strong>
        </div>
      )}
    </>
  )
}
