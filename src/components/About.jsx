import SectionTitle from './SectionTitle.jsx'
import { profile } from '../data/portfolio.js'

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionTitle index={1} label="PLAYER PROFILE" title="About me" />
        <div className="about">
          <div className="about__text">
            {profile.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <dl className="panel about__card">
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
          </dl>
        </div>
      </div>
    </section>
  )
}
