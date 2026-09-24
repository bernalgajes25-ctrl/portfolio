import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import JourneyMap from './JourneyMap.jsx'
import { journey } from '../data/portfolio.js'

const ICONS = { work: '★', study: '✎' }

// The player starts on the latest step that is still in progress
function startIndex() {
  const i = journey.findLastIndex((s) => s.current)
  return i >= 0 ? i : journey.length - 1
}

export default function Journey() {
  const [selected, setSelected] = useState(startIndex)

  return (
    <section className="section" id="journey">
      <div className="container">
        <SectionTitle index={2} label="WORLD MAP" title="My journey" />
        <JourneyMap steps={journey} selected={selected} onSelect={setSelected} />
        <ol className="map">
          {journey.map((step, i) => (
            <li
              className={`map__step ${step.current ? 'is-current' : ''} ${i === selected ? 'is-selected' : ''}`}
              key={step.level}
            >
              <span className="map__node" aria-hidden="true">
                {step.level}
              </span>
              <article className="map__card">
                <p className="map__meta">
                  <span className={`map__type map__type--${step.type}`}>
                    {ICONS[step.type]} {step.type === 'work' ? 'Work' : 'Study'}
                  </span>
                  <span>{step.period}</span>
                </p>
                <h3>{step.title}</h3>
                <p className="map__place">{step.place}</p>
                <p className="map__desc">{step.description}</p>
                {step.current && <span className="map__current">▶ In progress</span>}
              </article>
            </li>
          ))}
          <li className={`map__step is-locked ${selected === journey.length ? 'is-selected' : ''}`}>
            <span className="map__node" aria-hidden="true">
              ?-?
            </span>
            <article className="map__card">
              <p className="map__meta">
                <span className="map__type">🔒 Locked</span>
              </p>
              <h3>Next level</h3>
              <p className="map__desc">Your studio? Let’s unlock this one together.</p>
              <a href="#contact" className="btn btn--primary map__cta">
                Contact me
              </a>
            </article>
          </li>
        </ol>
      </div>
    </section>
  )
}
