import SectionTitle from './SectionTitle.jsx'
import { skills } from '../data/portfolio.js'

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <SectionTitle index={5} label="SKILL TREE" title="Skills & tools" />
        <div className="grid grid--skills">
          {skills.map((s) => (
            <div className="panel" key={s.group}>
              <h3 className="panel__title">{s.group}</h3>
              <ul className="tags">
                {s.items.map((i) => (
                  <li className="tag" key={i}>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
