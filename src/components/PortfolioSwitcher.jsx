import { useEffect, useState } from 'react'
import { sfx } from '../sound.js'

// Always-visible bar (bottom-left) with the portfolio modes.
// `highlight` shows a short hint right after the visitor picks a mode.
export default function PortfolioSwitcher({ variants, current, onChange, highlight }) {
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (!highlight) return
    const show = setTimeout(() => setHint(true), 2800)
    const hide = setTimeout(() => setHint(false), 10000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [highlight])

  return (
    <nav className={`switcher ${hint ? 'is-hinting' : ''}`} aria-label="Portfolio mode">
      {hint && (
        <p className="switcher__hint" role="status">
          Switch mode anytime here!
          <button onClick={() => setHint(false)} aria-label="Dismiss">
            ✕
          </button>
        </p>
      )}
      <span className="switcher__label">Mode</span>
      {variants.map((v) => (
        <button
          key={v.id}
          className={`switcher__option ${v.id === current ? 'is-active' : ''}`}
          aria-pressed={v.id === current}
          title={v.hint}
          onClick={() => {
            setHint(false)
            if (v.id === current) return
            sfx.select()
            onChange(v.id)
          }}
        >
          <span className="switcher__icon" aria-hidden="true">
            {v.icon}
          </span>
          {v.label}
        </button>
      ))}
    </nav>
  )
}
