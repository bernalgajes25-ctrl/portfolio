import { useRef, useState } from 'react'
import { Scene, Reveal, useScrollTicker, clamp01 } from './Scene.jsx'
import { PixelAvatar, SoundToggle } from '../shared.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import {
  profile,
  journey,
  games,
  qaResponsibilities,
  bugReport as report,
  bugReportTips,
  skills,
  devProjects,
  renders,
  links,
} from '../../data/portfolio.js'
import '../../styles/scroll.css'

// Chapters, in scroll order (used by the side rail and the header)
const CHAPTERS = [
  { id: 'cine-start', label: 'Start' },
  { id: 'cine-about', label: 'Profile' },
  { id: 'cine-journey', label: 'Journey' },
  { id: 'cine-games', label: 'Games' },
  { id: 'cine-report', label: 'Bug report' },
  { id: 'cine-skills', label: 'Skills' },
  { id: 'cine-dev', label: 'Dev & 3D' },
  { id: 'cine-contact', label: 'Contact' },
]

// Deterministic pseudo-random number in [0, 1) so layouts don't jump between renders
function rand(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// "1000+" → { value: 1000, suffix: "+" }
function parseStat(value) {
  const m = /^(\d+)(.*)$/.exec(value)
  return m ? { value: Number(m[1]), suffix: m[2] } : { value: null, suffix: value }
}

export default function ScrollPortfolio() {
  return (
    <div className="cine">
      <Stars />
      <Header />
      <Rail />
      <main>
        <IntroScene />
        <AboutScene />
        <JourneyScene />
        <GamesScene />
        <ReportScene />
        <SkillsScene />
        <DevScene />
        <ContactScene />
      </main>
    </div>
  )
}

/* ---------- Fixed chrome: header, progress, side rail, stars ---------- */

function useActiveChapter() {
  const [active, setActive] = useState(0)
  useScrollTicker(() => {
    const mid = window.innerHeight / 2
    const i = CHAPTERS.findIndex(({ id }) => {
      const r = document.getElementById(id)?.getBoundingClientRect()
      return r && r.top <= mid && r.bottom > mid
    })
    if (i !== -1) setActive(i)
  })
  return active
}

function Header() {
  const bar = useRef()
  const active = useActiveChapter()

  useScrollTicker(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
  })

  return (
    <header className="cine-header">
      <a href="#cine-start" className="cine-header__logo">
        <span className="accent">&gt;</span> {profile.name}
      </a>
      <span className="cine-header__chapter" aria-live="polite">
        {String(active + 1).padStart(2, '0')} · {CHAPTERS[active].label}
      </span>
      <SoundToggle />
      <span className="cine-header__bar" ref={bar} />
    </header>
  )
}

function Rail() {
  const active = useActiveChapter()
  return (
    <nav className="cine-rail" aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <a key={c.id} href={`#${c.id}`} className={i === active ? 'is-active' : ''}>
          <span>{c.label}</span>
        </a>
      ))}
    </nav>
  )
}

// Two layers of pixel stars that drift at different speeds (parallax)
function Stars() {
  const far = useRef()
  const near = useRef()
  useScrollTicker(() => {
    const y = window.scrollY
    if (far.current) far.current.style.transform = `translateY(${-(y * 0.05) % 400}px)`
    if (near.current) near.current.style.transform = `translateY(${-(y * 0.15) % 400}px)`
  })
  return (
    <div className="cine-stars" aria-hidden="true">
      <div className="cine-stars__layer cine-stars__layer--far" ref={far} />
      <div className="cine-stars__layer cine-stars__layer--near" ref={near} />
    </div>
  )
}

/* ---------- 1. Intro: zoom out of the avatar's eye ---------- */

function IntroScene() {
  const [statT, setStatT] = useState(0)
  // Letters are animated one by one but grouped by word, so lines only break between words
  let letterIndex = 0
  const words = profile.name.split(' ').map((word) => {
    const start = letterIndex
    letterIndex += word.length + 1
    return { word, start }
  })

  return (
    <Scene
      id="cine-start"
      label="Start"
      length={3.2}
      className="cine-intro"
      onProgress={(p) => setStatT(Math.round(clamp01((p - 0.7) / 0.15) * 50) / 50)}
    >
      <div className="cine-intro__avatar">
        <PixelAvatar />
      </div>

      <Reveal at={-1} len={0.04} out={0.05} className="cine-intro__hint">
        <span>Scroll to start</span>
        <span className="cine-intro__arrow">▼</span>
      </Reveal>

      <div className="cine-intro__text">
        <Reveal at={0.28} className="cine-intro__hello">
          &gt; Player 1 has entered the game
        </Reveal>
        <h1 className="cine-intro__name" aria-label={profile.name}>
          {words.map(({ word, start }) => (
            <span key={start} className="cine-intro__word" aria-hidden="true">
              {[...word].map((ch, k) => (
                <span key={k} style={{ '--i': start + k }}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <Reveal at={0.52} className="cine-intro__role">
          <span className="accent">{profile.role}</span> / DAM student
        </Reveal>
        <Reveal at={0.58} className="cine-intro__tagline">
          {profile.tagline}
        </Reveal>
        <ul className="cine-intro__stats">
          {profile.stats.map((s, i) => {
            const { value, suffix } = parseStat(s.value)
            return (
              <Reveal as="li" key={s.label} at={0.68 + i * 0.03} from="zoom">
                <strong>
                  {value == null ? suffix : `${Math.round(value * statT)}${suffix}`}
                </strong>
                <span>{s.label}</span>
              </Reveal>
            )
          })}
        </ul>
        <Reveal at={0.85} className="cine-intro__actions">
          {profile.currentJob && (
            <p className="badge">
              <span className="dot" /> Currently at{' '}
              <a href={profile.currentJob.url} target="_blank" rel="noreferrer">
                {profile.currentJob.company}
              </a>
            </p>
          )}
          <div className="cine-actions">
            <a href="#cine-games" className="btn btn--primary">
              View games
            </a>
            <a href="#cine-contact" className="btn">
              Contact me
            </a>
            <a href={profile.cvUrl} className="btn btn--ghost" download>
              Download CV
            </a>
          </div>
        </Reveal>
      </div>
    </Scene>
  )
}

/* ---------- 2. About: words light up as you scroll ---------- */

function AboutScene() {
  const words = profile.about.flatMap((p, pi) =>
    p.split(' ').map((w, wi) => ({ w, key: `${pi}-${wi}`, br: wi === 0 && pi > 0 })),
  )

  return (
    <Scene id="cine-about" label="Profile" length={3} tag="// 01 PLAYER PROFILE" title="About me" className="cine-about">
      <div className="cine-body">
        <div className="cine-pan-y cine-about__grid">
          <p className="cine-about__words" style={{ '--n': words.length }}>
            {words.map(({ w, key, br }, i) => (
              <span key={key}>
                {br && <span className="cine-about__break" />}
                <span className="cine-word" style={{ '--i': i }}>
                  {w}
                </span>{' '}
              </span>
            ))}
          </p>
          <Reveal as="dl" at={0.72} from="right" className="panel about__card">
            <div>
              <dt>Class</dt>
              <dd>{profile.role}</dd>
            </div>
            {profile.currentJob && (
              <div>
                <dt>Current guild</dt>
                <dd>QA Tester at {profile.currentJob.company}</dd>
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
          </Reveal>
        </div>
      </div>
    </Scene>
  )
}

/* ---------- 3. Journey: a horizontal road that moves as you scroll ---------- */

function JourneyScene() {
  const levels = [
    ...journey,
    { level: '???', type: 'next', title: 'Your studio?', place: 'Next level', period: 'Coming soon', locked: true },
  ]

  return (
    <Scene id="cine-journey" label="Journey" length={4} tag="// 02 WORLD MAP" title="My journey" className="cine-journey">
      <div className="cine-journey__viewport">
        <ol className="cine-pan-x cine-journey__track">
          {levels.map((l) => (
            <li key={l.level + l.title} className={`cine-level ${l.locked ? 'is-locked' : ''} ${l.current ? 'is-current' : ''}`}>
              <div className="cine-level__card">
                <p className="map__meta">
                  <span className={`map__type--${l.type}`}>{l.type === 'next' ? '🔒 Locked' : l.type}</span> ·{' '}
                  {l.period}
                </p>
                <h3>{l.title}</h3>
                <p className="map__place">{l.place}</p>
                {l.description && !l.description.startsWith('TODO') && <p className="map__desc">{l.description}</p>}
                {l.current && <span className="map__current">▶ In progress</span>}
                {l.locked && (
                  <a className="map__cta" href="#cine-contact">
                    Unlock it → contact me
                  </a>
                )}
              </div>
              <span className="cine-level__flag">{l.level}</span>
            </li>
          ))}
        </ol>
        <div className="cine-journey__ground" />
        <PixelAvatar className="cine-journey__walker" />
      </div>
    </Scene>
  )
}

/* ---------- 4. Games: full-screen covers, one per scroll step ---------- */

const GAMES_START = 0.14

function GamesScene() {
  const [index, setIndex] = useState(-1)
  const n = games.length

  const onProgress = (p) => {
    const i = p < GAMES_START ? -1 : Math.min(n - 1, Math.floor(((p - GAMES_START) / (1 - GAMES_START)) * n))
    setIndex(i)
  }

  return (
    <Scene
      id="cine-games"
      label="Games"
      length={1.5 + n * 0.55}
      tag="// 03 QUEST LOG"
      title={`${n} games tested`}
      className="cine-games"
      onProgress={onProgress}
    >
      <div className={`cine-games__intro ${index === -1 ? 'is-active' : ''}`}>
        <div className="panel">
          <h3 className="panel__title">What I do on every project</h3>
          <ul className="card__tasks">
            {qaResponsibilities.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {games.map((g, i) => (
        <article
          key={g.title}
          className={`cine-game ${i === index ? 'is-active' : ''} ${i < index ? 'is-past' : ''}`}
          aria-hidden={i !== index}
        >
          <div className="cine-game__media">
            {g.image ? <img src={g.image} alt="" loading="lazy" /> : <Placeholder text={g.title} />}
          </div>
          <div className="cine-game__info">
            <p className="cine-game__count">
              <span className="accent">{String(i + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')} ·{' '}
              {g.year}
            </p>
            <h3>{g.title}</h3>
            <p className="cine-game__meta">
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
            {g.link && (
              <a className="btn btn--primary" href={g.link} target="_blank" rel="noreferrer" tabIndex={i === index ? 0 : -1}>
                View game →
              </a>
            )}
          </div>
        </article>
      ))}

      <ol className="cine-games__progress" aria-hidden="true">
        {games.map((g, i) => (
          <li key={g.title} className={i <= index ? 'is-done' : ''} />
        ))}
      </ol>
    </Scene>
  )
}

/* ---------- 5. Bug report: written line by line, then stamped ---------- */

function ReportScene() {
  const r = report
  return (
    <Scene id="cine-report" label="Bug report" length={3.5} tag="// 04 SAVE FILE" title="How I report a bug" className="cine-report">
      <div className="cine-body">
        <div className="cine-pan-y cine-report__layout">
          <Reveal as="article" at={0.12} from="zoom" className="window cine-report__window">
            <header className="window__bar">
              <span>{r.id}.txt</span>
              <span className="window__buttons" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </header>
            <div className="window__body">
              <Reveal as="h3" at={0.16} className="report__title">
                {r.title}
              </Reveal>
              <Reveal as="dl" at={0.22} className="report__fields">
                {[
                  ['Severity', <span key="s" className={`sev sev--${r.severity.toLowerCase()}`}>{r.severity}</span>],
                  ['Priority', r.priority],
                  ['Repro rate', r.reproducibility],
                  ['Build', r.build],
                  ['Platform', r.platform],
                  ['Area', r.area],
                ].map(([dt, dd]) => (
                  <div key={dt}>
                    <dt>{dt}</dt>
                    <dd>{dd}</dd>
                  </div>
                ))}
              </Reveal>
              <Reveal at={0.3}>
                <h4>Steps to reproduce</h4>
                <ol className="report__steps">
                  {r.steps.map((s, i) => (
                    <Reveal as="li" key={s} at={0.33 + i * 0.05} from="left">
                      {s}
                    </Reveal>
                  ))}
                </ol>
              </Reveal>
              <div className="report__results">
                <Reveal at={0.5} from="left" className="result result--expected">
                  <h4>✔ Expected</h4>
                  <p>{r.expected}</p>
                </Reveal>
                <Reveal at={0.56} from="right" className="result result--actual">
                  <h4>✘ Actual</h4>
                  <p>{r.actual}</p>
                </Reveal>
              </div>
              <Reveal at={0.62}>
                <h4>Attachments</h4>
                <ul className="tags">
                  {r.attachments.map((a) => (
                    <li className="tag" key={a}>
                      📎 {a}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal at={0.8} len={0.05} from="stamp" className="cine-report__stamp">
              Reported ✔
            </Reveal>
          </Reveal>
          <Reveal as="aside" at={0.68} from="right" className="panel cine-report__tips">
            <h3 className="panel__title">What makes it useful</h3>
            <ul className="checklist">
              {bugReportTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Scene>
  )
}

/* ---------- 6. Skills: scattered tags assemble into the skill tree ---------- */

function SkillsScene() {
  let k = 0
  return (
    <Scene id="cine-skills" label="Skills" length={2.8} tag="// 05 SKILL TREE" title="Skills" className="cine-skills">
      <div className="cine-body">
        <div className="cine-pan-y cine-skills__grid">
          {skills.map((g, gi) => (
            <div key={g.group} className="panel cine-skills__group">
              <Reveal as="h3" at={0.12 + gi * 0.04} className="panel__title">
                {g.group}
              </Reveal>
              <ul className="tags">
                {g.items.map((item) => {
                  const i = k++
                  return (
                    <li
                      key={item}
                      className="tag tag--accent cine-skill"
                      style={{
                        '--dx': `${(rand(i, 1) - 0.5) * 120}vw`,
                        '--dy': `${(rand(i, 2) - 0.5) * 120}vh`,
                        '--rot': `${(rand(i, 3) - 0.5) * 540}deg`,
                        '--at': 0.12 + rand(i, 4) * 0.3,
                      }}
                    >
                      {item}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  )
}

/* ---------- 7. Dev projects + Blender renders ---------- */

function DevScene() {
  return (
    <Scene id="cine-dev" label="Dev & 3D" length={2.4} tag="// 06 SIDE QUESTS" title="Dev & 3D" className="cine-dev">
      <div className="cine-body">
        <div className="cine-pan-y cine-dev__layout">
          <div className="cine-dev__projects">
            {devProjects.map((d, i) => (
              <Reveal key={d.title} at={0.14 + i * 0.08} from="left" className="panel dev">
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
              </Reveal>
            ))}
          </div>
          <div className="cine-dev__renders">
            {renders.map((r, i) => (
              <Reveal key={r.title} at={0.35 + i * 0.08} from="flip" className="gallery__item">
                {r.image ? <img src={r.image} alt={r.title} loading="lazy" /> : <Placeholder text={r.title} />}
                <span className="gallery__caption">{r.title}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  )
}

/* ---------- 8. Contact: level complete ---------- */

function ContactScene() {
  return (
    <section id="cine-contact" data-label="Contact" className="cine-contact">
      <div className="container">
        <p className="cine-title__tag">// 07 MULTIPLAYER</p>
        <h2 className="cine-contact__title">
          {[...'LEVEL COMPLETE'].map((ch, i) => (
            <span key={i} style={{ '--i': i }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </h2>
        <div className="panel contact">
          <p>
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
        <a href="#cine-start" className="cine-contact__replay">
          ↑ Play again
        </a>
        <p className="cine-contact__footer">
          © {new Date().getFullYear()} {profile.name} · Built with React + Vite
        </p>
      </div>
    </section>
  )
}
