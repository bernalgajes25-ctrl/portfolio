import { profile } from '../data/portfolio.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          © {new Date().getFullYear()} {profile.name} · Built with React + Vite ·{' '}
          <span className="accent">No known bugs</span> (yet)
        </p>
        <p className="footer__secret">↑ ↑ ↓ ↓ ← → ← → B A</p>
      </div>
    </footer>
  )
}
