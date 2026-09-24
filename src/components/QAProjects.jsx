import SectionTitle from './SectionTitle.jsx'
import Placeholder from './Placeholder.jsx'
import { games, qaResponsibilities } from '../data/portfolio.js'

export default function QAProjects() {
  return (
    <section className="section" id="qa">
      <div className="container">
        <SectionTitle index={3} label="QUEST LOG" title="Games I’ve tested" />
        <div className="panel qa-summary">
          <h3 className="panel__title">What I do on every project</h3>
          <ul className="card__tasks">
            {qaResponsibilities.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid--cards">
          {games.map((g) => (
            <article className="card" key={g.title}>
              <div className="card__media">
                {g.image ? (
                  <img src={g.image} alt={`${g.title} cover`} loading="lazy" />
                ) : (
                  <Placeholder text={g.title} />
                )}
                <span className="card__year">{g.year}</span>
              </div>
              <div className="card__body">
                <h3>{g.title}</h3>
                <p className="card__meta">
                  {g.studio} · {g.genre}
                </p>
                <ul className="tags">
                  {g.platforms.map((p) => (
                    <li className="tag tag--accent" key={p}>
                      {p}
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
                {g.tools?.length > 0 && (
                  <ul className="tags">
                    {g.tools.map((t) => (
                      <li className="tag" key={t}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                {g.link && (
                  <a className="card__link" href={g.link} target="_blank" rel="noreferrer">
                    View game →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
