import Avatar from './Avatar.jsx'
import BugInvaders from './BugInvaders.jsx'
import { profile } from '../data/portfolio.js'

export default function Hero({ onSecret }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div>
          {profile.currentJob && (
            <p className="badge">
              <span className="dot" /> Currently working at{' '}
              {profile.currentJob.url ? (
                <a href={profile.currentJob.url} target="_blank" rel="noreferrer">
                  {profile.currentJob.company}
                </a>
              ) : (
                profile.currentJob.company
              )}
            </p>
          )}
          {profile.available && (
            <p className="badge">
              <span className="dot" /> Open to work
            </p>
          )}
          <Avatar onSecret={onSecret} />
          <p className="hero__hello">&gt; Player 1 has entered the game</p>
          <h1 className="hero__name">{profile.name}</h1>
          <p className="hero__role">
            <span className="accent">{profile.role}</span> / DAM student
          </p>
          <p className="hero__tagline">{profile.tagline}</p>
          <div className="hero__actions">
            <a href="#qa" className="btn btn--primary">
              View projects
            </a>
            <a href="#contact" className="btn">
              Contact me
            </a>
            <a href={profile.cvUrl} className="btn btn--ghost" download>
              Download CV
            </a>
          </div>
          <ul className="hero__stats">
            {profile.stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <BugInvaders />
      </div>
    </section>
  )
}
