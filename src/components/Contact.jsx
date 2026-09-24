import SectionTitle from './SectionTitle.jsx'
import { links, profile } from '../data/portfolio.js'

export default function Contact() {
  return (
    <section className="section" id="contact">
      <div className="container">
        <SectionTitle index={8} label="MULTIPLAYER" title="Let’s work together" />
        <div className="panel contact">
          <p>
            Looking for a QA tester for your next game? Send me a message — I’ll reply faster than a
            respawn.
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
      </div>
    </section>
  )
}
