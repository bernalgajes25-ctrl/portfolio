import SectionTitle from './SectionTitle.jsx'
import { devProjects } from '../data/portfolio.js'

export default function DevProjects() {
  return (
    <section className="section" id="dev">
      <div className="container">
        <SectionTitle index={6} label="SIDE QUESTS" title="Development projects" />
        <p className="section__intro">
          Things I’m building while studying Multiplatform App Development (DAM).
        </p>
        <div className="grid grid--cards">
          {devProjects.map((p) => (
            <article className="panel dev" key={p.title}>
              <h3 className="panel__title">{p.title}</h3>
              <p>{p.description}</p>
              <ul className="tags">
                {p.stack.map((t) => (
                  <li className="tag" key={t}>
                    {t}
                  </li>
                ))}
              </ul>
              {(p.repo || p.demo) && (
                <div className="dev__links">
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer">
                      Code →
                    </a>
                  )}
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer">
                      Live demo →
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
