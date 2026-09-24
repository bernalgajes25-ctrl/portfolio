import { useEffect, useRef, useState } from 'react'
import { PixelAvatar } from '../variants/shared.jsx'
import { profile } from '../data/portfolio.js'
import { sfx } from '../sound.js'

// "Select mode" screen shown on the first visit, so visitors know the
// portfolio has three versions. ← → / 1-3 to choose, Enter to start.
export default function ModeSelect({ variants, initial, onPick }) {
  const [selected, setSelected] = useState(() => Math.max(0, variants.findIndex((v) => v.id === initial)))
  const cards = useRef([])
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  useEffect(() => {
    cards.current[selected]?.focus({ preventScroll: true })
  }, [selected])

  useEffect(() => {
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= variants.length) {
        sfx.select()
        onPick(variants[n - 1].id)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        sfx.select()
        onPick(variants[selectedRef.current].id)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        sfx.blip()
        setSelected((s) => (s + 1) % variants.length)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        sfx.blip()
        setSelected((s) => (s - 1 + variants.length) % variants.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variants, onPick])

  return (
    <main className="mode-select">
      <div className="mode-select__intro">
        <PixelAvatar className="mode-select__avatar" />
        <p className="mode-select__bubble">Hi! I’m {profile.name.split(' ')[0]}. How do you want to see my portfolio?</p>
      </div>
      <h1 className="mode-select__title">Select mode</h1>

      <ul className="mode-select__list" role="listbox" aria-label="Portfolio mode">
        {variants.map((v, i) => (
          <li key={v.id}>
            <button
              ref={(el) => (cards.current[i] = el)}
              role="option"
              aria-selected={i === selected}
              className={`mode-card ${i === selected ? 'is-selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              onClick={() => {
                sfx.select()
                onPick(v.id)
              }}
            >
              <span className="mode-card__slot">{i + 1}</span>
              <Preview id={v.id} />
              <span className="mode-card__name">{v.label}</span>
              <span className="mode-card__time">{v.time}</span>
              <span className="mode-card__blurb">{v.blurb}</span>
              <span className="mode-card__start">{i === selected ? '▶ Press start' : 'Select'}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mode-select__note">
        <span className="mode-select__keyhelp">
          <span className="mode-select__keys">← →</span> choose · <span className="mode-select__keys">Enter</span> start ·{' '}
        </span>
        You can switch mode anytime from the bar at the bottom
      </p>
    </main>
  )
}

// Tiny animated mock-up of each version
function Preview({ id }) {
  if (id === 'classic') {
    return (
      <span className="mode-preview mode-preview--classic" aria-hidden="true">
        <i className="mp-nav" />
        <i className="mp-title" />
        <i className="mp-line" />
        <i className="mp-line mp-line--short" />
        <span className="mp-cards">
          <i />
          <i />
          <i />
        </span>
      </span>
    )
  }
  if (id === 'scroll') {
    return (
      <span className="mode-preview mode-preview--scroll" aria-hidden="true">
        <span className="mp-frames">
          <i />
          <i />
          <i />
        </span>
        <i className="mp-arrow">▼</i>
      </span>
    )
  }
  return (
    <span className="mode-preview mode-preview--game" aria-hidden="true">
      <i className="mp-block">?</i>
      <PixelAvatar className="mp-hero" />
      <i className="mp-bug" />
      <i className="mp-ground" />
    </span>
  )
}
