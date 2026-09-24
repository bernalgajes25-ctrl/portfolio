import { useEffect, useState } from 'react'
import { games, profile } from '../data/portfolio.js'

// Short terminal-style intro. Shown once per browser session;
// click or press any key to skip.
const LINES = [
  { text: '> BOOT qa_tester.exe', cls: '' },
  { text: `> LOADING PROFILE ........ ${profile.name}`, cls: '' },
  { text: `> LOADING GAMES .......... ${games.length} FOUND`, cls: '' },
  { text: '> RUNNING TEST SUITE ..... OK', cls: 'ok' },
  { text: '> KNOWN BUGS ............. 0 (for now)', cls: 'accent' },
]
const STEP_MS = 280

function alreadySeen() {
  try {
    return sessionStorage.getItem('booted') === '1'
  } catch {
    return false
  }
}

export default function BootScreen() {
  const [visible, setVisible] = useState(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return !reduced && !alreadySeen()
  })
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    try {
      sessionStorage.setItem('booted', '1')
    } catch {
      // ignore
    }

    const timers = LINES.map((_, i) => setTimeout(() => setShown(i + 1), STEP_MS * (i + 1)))
    const total = STEP_MS * (LINES.length + 2)
    timers.push(setTimeout(() => setLeaving(true), total))
    timers.push(setTimeout(() => setVisible(false), total + 400))

    const skip = () => {
      setLeaving(true)
      setTimeout(() => setVisible(false), 400)
    }
    window.addEventListener('keydown', skip)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`boot ${leaving ? 'is-leaving' : ''}`}
      onClick={() => {
        setLeaving(true)
        setTimeout(() => setVisible(false), 400)
      }}
      aria-hidden="true"
    >
      <div className="boot__log">
        {LINES.slice(0, shown).map((l) => (
          <div key={l.text} className={l.cls}>
            {l.text}
          </div>
        ))}
        <div className="boot__bar">
          <span style={{ width: `${(shown / LINES.length) * 100}%` }} />
        </div>
        <div className="boot__skip">click or press any key to skip</div>
      </div>
    </div>
  )
}
