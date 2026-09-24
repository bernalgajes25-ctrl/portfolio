import { useEffect, useState } from 'react'
import { profile } from '../data/portfolio.js'
import { isSoundOn, onSoundChange, setSoundOn, sfx } from '../sound.js'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Journey' },
  { id: 'qa', label: 'Games' },
  { id: 'bug-report', label: 'Bug report' },
  { id: 'skills', label: 'Skills' },
  { id: 'dev', label: 'Dev' },
  { id: 'other', label: '3D' },
  { id: 'contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [sound, setSound] = useState(isSoundOn)

  useEffect(() => onSoundChange(setSound), [])

  const toggleSound = () => {
    setSoundOn(!sound)
    if (!sound) sfx.select() // plays only once sound is on
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <a href="#top" className="navbar__logo" onClick={() => setOpen(false)}>
          <span className="accent">&gt;</span> {profile.name}
          <span className="cursor">_</span>
        </a>
        <button
          className="navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={`navbar__links ${open ? 'is-open' : ''}`}>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="sound-toggle"
          aria-pressed={sound}
          aria-label={sound ? 'Mute sound effects' : 'Turn on sound effects'}
          onClick={toggleSound}
        >
          ♪ {sound ? 'ON' : 'OFF'}
        </button>
      </div>
    </nav>
  )
}
