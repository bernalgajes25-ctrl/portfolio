import { useEffect, useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import Placeholder from './Placeholder.jsx'
import { renders } from '../data/portfolio.js'

export default function Gallery3D() {
  const [active, setActive] = useState(null)

  // Close the lightbox with Escape
  useEffect(() => {
    if (!active) return
    const onKey = (e) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return (
    <section className="section" id="other">
      <div className="container">
        <SectionTitle index={7} label="BONUS LEVEL" title="Other · 3D with Blender" />
        <p className="section__intro">A few things I made while learning Blender, just for fun.</p>
        <div className="grid grid--gallery">
          {renders.map((r) => (
            <button
              className="gallery__item"
              key={r.title}
              onClick={() => r.image && setActive(r)}
              aria-label={`Open ${r.title}`}
            >
              {r.image ? (
                <img src={r.image} alt={r.title} loading="lazy" />
              ) : (
                <Placeholder text={r.title} />
              )}
              <span className="gallery__caption">{r.title}</span>
            </button>
          ))}
        </div>
      </div>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <img src={active.image} alt={active.title} />
          <p>{active.title}</p>
        </div>
      )}
    </section>
  )
}
