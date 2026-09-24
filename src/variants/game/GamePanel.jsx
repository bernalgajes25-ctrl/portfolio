import { useEffect, useRef } from 'react'
import Placeholder from '../../components/Placeholder.jsx'
import {
  profile,
  journey,
  games,
  qaResponsibilities,
  bugReport as r,
  bugReportTips,
  skills,
  devProjects,
  renders,
  links,
} from '../../data/portfolio.js'

// Window title shown in the bar of each panel
function panelTitle(panel) {
  const [zone, index] = panel.split(':')
  switch (zone) {
    case 'about':
      return 'PROFILE.SAV'
    case 'journey':
      return `LEVEL ${journey[index].level}`
    case 'locked':
      return 'LEVEL ???'
    case 'report':
      return `${r.id}.txt`
    case 'game':
      return `CABINET ${String(Number(index) + 1).padStart(2, '0')}`
    case 'games':
      return 'ARCADE.LST'
    case 'skills':
      return 'SKILL TREE'
    case 'dev':
      return 'WORKSHOP'
    case 'contact':
      return 'MULTIPLAYER'
    default:
      return ''
  }
}

// Modal window with the portfolio content for one object of the level
export default function GamePanel({ panel, onClose, onNavigate, foundSkills, goalReached }) {
  const closeBtn = useRef()
  useEffect(() => closeBtn.current?.focus(), [panel])

  const [zone, rawIndex] = panel.split(':')
  const index = Number(rawIndex)

  return (
    <div className="game-modal" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="window game-modal__window" role="dialog" aria-modal="true" aria-labelledby="game-modal-title">
        <header className="window__bar">
          <span id="game-modal-title">{panelTitle(panel)}</span>
          <button className="game-modal__close" onClick={onClose} ref={closeBtn} aria-label="Close (Esc)">
            ✕
          </button>
        </header>
        <div className="window__body game-modal__body">
          {zone === 'about' && <About />}
          {zone === 'journey' && <Level level={journey[index]} />}
          {zone === 'locked' && <Locked />}
          {zone === 'report' && <Report />}
          {zone === 'game' && <Game index={index} onNavigate={onNavigate} />}
          {zone === 'games' && <Arcade onNavigate={onNavigate} />}
          {zone === 'skills' && <Skills found={foundSkills} />}
          {zone === 'dev' && <Dev />}
          {zone === 'contact' && <Contact goalReached={goalReached} />}
        </div>
        <p className="game-modal__hint">Esc / B to close</p>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="game-about">
      <div>
        <h3 className="game-modal__heading">{profile.name}</h3>
        <p className="game-modal__sub">
          <span className="accent">{profile.role}</span> / DAM student
        </p>
        {profile.about.map((p, i) => (
          <p key={i} className="game-modal__text">
            {p}
          </p>
        ))}
        <ul className="hero__stats">
          {profile.stats.map((s) => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="panel about__card">
        <div>
          <dt>Class</dt>
          <dd>{profile.role}</dd>
        </div>
        {profile.currentJob && (
          <div>
            <dt>Current guild</dt>
            <dd>
              QA Tester at{' '}
              <a href={profile.currentJob.url} target="_blank" rel="noreferrer">
                {profile.currentJob.company}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt>Current quest</dt>
          <dd>Multiplatform App Development (DAM)</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{profile.location}</dd>
        </div>
        <div>
          <dt>Side skill</dt>
          <dd>3D with Blender</dd>
        </div>
      </dl>
    </div>
  )
}

function Level({ level: l }) {
  return (
    <div className="map__card game-level">
      <p className="map__meta">
        <span className={`map__type--${l.type}`}>{l.type}</span> · {l.period}
      </p>
      <h3>{l.title}</h3>
      <p className="map__place">{l.place}</p>
      {l.description && !l.description.startsWith('TODO') && <p className="map__desc">{l.description}</p>}
      {l.current && <span className="map__current">▶ In progress</span>}
    </div>
  )
}

function Locked() {
  return (
    <div className="game-locked">
      <h3 className="game-modal__heading">Next level: locked 🔒</h3>
      <p className="game-modal__text">This level unlocks when a studio adds a new QA tester to its party. Could it be yours?</p>
      <a className="btn btn--primary" href={`mailto:${links.email}`}>
        Unlock it → {links.email}
      </a>
    </div>
  )
}

function Report() {
  return (
    <div className="game-report">
      <h3 className="report__title">{r.title}</h3>
      <dl className="report__fields">
        <div>
          <dt>Severity</dt>
          <dd>
            <span className={`sev sev--${r.severity.toLowerCase()}`}>{r.severity}</span>
          </dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{r.priority}</dd>
        </div>
        <div>
          <dt>Repro rate</dt>
          <dd>{r.reproducibility}</dd>
        </div>
        <div>
          <dt>Build</dt>
          <dd>{r.build}</dd>
        </div>
        <div>
          <dt>Platform</dt>
          <dd>{r.platform}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{r.area}</dd>
        </div>
      </dl>
      <h4>Preconditions</h4>
      <ul className="report__list">
        {r.preconditions.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <h4>Steps to reproduce</h4>
      <ol className="report__steps">
        {r.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="report__results">
        <div className="result result--expected">
          <h4>✔ Expected</h4>
          <p>{r.expected}</p>
        </div>
        <div className="result result--actual">
          <h4>✘ Actual</h4>
          <p>{r.actual}</p>
        </div>
      </div>
      <h4>Notes</h4>
      <p className="report__notes">{r.notes}</p>
      <h4>What makes it useful</h4>
      <ul className="checklist">
        {bugReportTips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="game-modal__small">A fictional example: real reports are under NDA.</p>
    </div>
  )
}

function Game({ index, onNavigate }) {
  const g = games[index]
  return (
    <article className="game-cart">
      <div className="card__media">
        {g.image ? <img src={g.image} alt={`${g.title} cover`} /> : <Placeholder text={g.title} />}
        <span className="card__year">{g.year}</span>
      </div>
      <h3 className="game-modal__heading">{g.title}</h3>
      <p className="card__meta">
        {g.studio} · {g.genre}
      </p>
      <ul className="tags">
        {g.platforms.map((p) => (
          <li className="tag tag--accent" key={p}>
            {p}
          </li>
        ))}
        {g.tools?.map((t) => (
          <li className="tag" key={t}>
            {t}
          </li>
        ))}
      </ul>
      <p className="card__role">Role: {g.role}</p>
      {g.tasks?.length > 0 && (
        <ul className="card__tasks">
          {g.tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <div className="game-cart__nav">
        <button className="btn" disabled={index === 0} onClick={() => onNavigate(`game:${index - 1}`)}>
          ◀ Prev
        </button>
        {g.link && (
          <a className="btn btn--primary" href={g.link} target="_blank" rel="noreferrer">
            View game →
          </a>
        )}
        <button className="btn" disabled={index === games.length - 1} onClick={() => onNavigate(`game:${index + 1}`)}>
          Next ▶
        </button>
      </div>
    </article>
  )
}

function Arcade({ onNavigate }) {
  return (
    <div>
      <h3 className="game-modal__heading">{games.length} games tested</h3>
      <ul className="card__tasks game-modal__duties">
        {qaResponsibilities.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <ul className="game-arcade">
        {games.map((g, i) => (
          <li key={g.title}>
            <button onClick={() => onNavigate(`game:${i}`)}>
              {g.image ? <img src={g.image} alt="" loading="lazy" /> : <Placeholder text={g.title} />}
              <span>{g.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Skills({ found }) {
  const total = skills.reduce((n, g) => n + g.items.length, 0)
  return (
    <div>
      <p className="game-modal__text">
        Found <span className="accent">{found.length}</span> / {total} by hitting the <span className="accent">?</span> blocks.
        The rest are listed too, no need to jump for them.
      </p>
      <div className="game-skills">
        {skills.map((g) => (
          <div key={g.group}>
            <h4>{g.group}</h4>
            <ul className="tags">
              {g.items.map((item) => (
                <li key={item} className={`tag ${found.includes(item) ? 'tag--accent' : ''}`}>
                  {found.includes(item) && '★ '}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dev() {
  return (
    <div className="game-dev">
      {devProjects.map((d) => (
        <div key={d.title} className="panel dev">
          <h3 className="panel__title">{d.title}</h3>
          <p>{d.description}</p>
          <ul className="tags">
            {d.stack.map((s) => (
              <li className="tag tag--accent" key={s}>
                {s}
              </li>
            ))}
          </ul>
          {(d.repo || d.demo) && (
            <div className="dev__links">
              {d.repo && (
                <a href={d.repo} target="_blank" rel="noreferrer">
                  Code →
                </a>
              )}
              {d.demo && (
                <a href={d.demo} target="_blank" rel="noreferrer">
                  Demo →
                </a>
              )}
            </div>
          )}
        </div>
      ))}
      <h4>Blender renders</h4>
      <div className="game-dev__renders">
        {renders.map((item) => (
          <figure key={item.title} className="gallery__item">
            {item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : <Placeholder text={item.title} />}
            <figcaption className="gallery__caption">{item.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function Contact({ goalReached }) {
  return (
    <div className="game-contact">
      {goalReached && <p className="game-contact__clear">★ Level complete ★</p>}
      <h3 className="game-modal__heading">Let’s work together</h3>
      <p className="game-modal__text">
        Looking for a QA tester for your next game? Send me a message — I’ll reply faster than a respawn.
      </p>
      <div className="contact__links">
        <a className="btn btn--primary" href={`mailto:${links.email}`}>
          {links.email}
        </a>
        <a className="btn" href={links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a className="btn" href={links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a className="btn btn--ghost" href={profile.cvUrl} download>
          CV
        </a>
      </div>
    </div>
  )
}
