import SectionTitle from './SectionTitle.jsx'
import { bugReport as r, bugReportTips } from '../data/portfolio.js'

export default function BugReport() {
  return (
    <section className="section" id="bug-report">
      <div className="container">
        <SectionTitle index={4} label="SAVE FILE" title="How I report a bug" />
        <p className="section__intro">
          A fictional example (real reports are under NDA) showing the format I use every day.
        </p>
        <div className="report-layout">
          <article className="window">
            <header className="window__bar">
              <span>{r.id}.txt</span>
              <span className="window__buttons" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </header>
            <div className="window__body">
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

              <h4>Attachments</h4>
              <ul className="tags">
                {r.attachments.map((a) => (
                  <li className="tag" key={a}>
                    📎 {a}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <aside className="panel report__tips">
            <h3 className="panel__title">What makes it useful</h3>
            <ul className="checklist">
              {bugReportTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
