import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame } from './engine.js'
import { ZONES } from './level.js'
import GamePanel from './GamePanel.jsx'
import Toast from '../../components/Toast.jsx'
import { PixelAvatar, SoundToggle } from '../shared.jsx'
import { profile, skills } from '../../data/portfolio.js'
import { sfx } from '../../sound.js'
import '../../styles/game.css'

const KEYS = {
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
  ArrowUp: 'jump',
  w: 'jump',
  ' ': 'jump',
  z: 'jump',
  e: 'interact',
  ArrowDown: 'interact',
  s: 'interact',
  Enter: 'interact',
  x: 'interact',
}

const BUG_MILESTONES = {
  1: { title: 'First bug fixed', text: 'Jump on them to squash them. There are more on the way.' },
  5: { title: 'Exterminator', text: '5 bugs fixed. The build is looking cleaner.' },
  15: { title: 'QA legend', text: '15 bugs fixed. Please hire this tester.' },
}

const SKILLS_TOTAL = skills.reduce((n, g) => n + g.items.length, 0)

// Panel id → portfolio section (for the "explored" counter)
function zoneOf(panel) {
  const zone = panel.split(':')[0]
  return { game: 'games', locked: 'journey' }[zone] ?? zone
}

const isTouch = () => window.matchMedia('(pointer: coarse)').matches

export default function GamePortfolio() {
  const canvasRef = useRef()
  const game = useRef()
  const [started, setStarted] = useState(false)
  const [panel, setPanel] = useState(null)
  const [menu, setMenu] = useState(false)
  const [bugs, setBugs] = useState(0)
  const [found, setFound] = useState([])
  const [explored, setExplored] = useState([])
  const [goal, setGoal] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  const showToast = useCallback((title, text) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), title, text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const explore = useCallback((zone) => {
    setExplored((list) => (list.includes(zone) ? list : [...list, zone]))
  }, [])

  const openPanel = useCallback(
    (id) => {
      sfx.select()
      explore(zoneOf(id))
      setPanel(id)
    },
    [explore],
  )

  // Start the engine once; React only handles the HUD and the panels
  useEffect(() => {
    const g = createGame(canvasRef.current, {
      touch: isTouch,
      onOpen: openPanel,
      onBug: (count, big) => {
        setBugs(count)
        if (big) showToast('Critical bug fixed', 'The softlock from BUG-0427 is gone. Nice work!')
        else if (BUG_MILESTONES[count]) {
          sfx.powerUp()
          showToast(BUG_MILESTONES[count].title, BUG_MILESTONES[count].text)
        }
      },
      onSkill: (item, count, total, completedGroup) => {
        setFound((list) => [...list, item])
        explore('skills')
        if (count === total) {
          sfx.powerUp()
          showToast('Skill tree complete', 'Every skill unlocked. Open the Skills menu to see them all.')
        } else if (completedGroup) {
          showToast(`${completedGroup} unlocked`, 'Block empty! Try the next one.')
        }
      },
      onGoal: () => {
        setGoal(true)
        showToast('Level complete!', 'Thanks for playing. Here’s how to reach me.')
        openPanel('contact')
      },
    })
    game.current = g
    const timer = setInterval(() => setProgress(g.progress()), 150)
    return () => {
      clearInterval(timer)
      g.destroy()
    }
  }, [openPanel, explore, showToast])

  // Pause the world while a window is open
  useEffect(() => {
    game.current?.setPaused(!started || panel !== null || menu)
  }, [started, panel, menu])

  // The game fills the screen: no page scroll while it is mounted
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // 100% completion achievement
  useEffect(() => {
    if (explored.length === ZONES.length) {
      sfx.powerUp()
      showToast('100% explored', 'You have seen every part of the portfolio. Achievement unlocked!')
    }
  }, [explored.length, showToast])

  const closePanel = useCallback(() => setPanel(null), [])

  const navigate = useCallback(
    (id) => {
      game.current?.warp(id)
      setMenu(false)
      setStarted(true)
      openPanel(id)
    },
    [openPanel],
  )

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      const down = e.type === 'keydown'
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (e.target.closest?.('input, textarea')) return

      if (down && !e.repeat && ['Escape', 'b', 'e'].includes(key) && (panel || menu)) {
        e.preventDefault()
        setPanel(null)
        setMenu(false)
        return
      }
      if (down && key === 'm' && started && !panel) {
        setMenu((m) => !m)
        return
      }
      if (panel || menu) return

      if (!started) {
        if (down && (key === 'Enter' || key === ' ')) {
          e.preventDefault()
          setStarted(true)
          sfx.powerUp()
        }
        return
      }
      const action = KEYS[key]
      if (!action) return
      // Keep Enter/Space working on focused buttons (menu, sound…)
      if ((key === 'Enter' || key === ' ') && e.target.closest?.('button, a')) return
      e.preventDefault()
      if (!e.repeat || !down) game.current?.press(action, down)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [started, panel, menu])

  const zones = game.current?.zones() ?? []

  return (
    <div className="game">
      <canvas ref={canvasRef} className="game__canvas" aria-label="Side-scrolling level of the portfolio" />

      {started && (
        <>
          <header className="game-hud">
            <p className="game-hud__title">
              <span className="accent">▶</span> {profile.name}
            </p>
            <ul className="game-hud__stats">
              <li>
                Bugs fixed <strong>{String(bugs).padStart(2, '0')}</strong>
              </li>
              <li>
                Skills{' '}
                <strong>
                  {found.length}/{SKILLS_TOTAL}
                </strong>
              </li>
              <li>
                Explored{' '}
                <strong>
                  {explored.length}/{ZONES.length}
                </strong>
              </li>
            </ul>
            <div className="game-hud__buttons">
              <button className="sound-toggle" onClick={() => setMenu(true)}>
                ☰ Menu
              </button>
              <SoundToggle />
            </div>
            <div className="game-hud__map" aria-hidden="true">
              <span className="game-hud__you" style={{ left: `${progress * 100}%` }} />
              {zones.map((z) => {
                const info = ZONES.find((i) => i.id === z.id)
                return (
                  <span
                    key={z.id}
                    className={`game-hud__zone ${explored.includes(z.id) ? 'is-done' : ''}`}
                    style={{ left: `${z.at * 100}%` }}
                    title={info?.label}
                  >
                    {info?.icon}
                  </span>
                )
              })}
            </div>
          </header>

          <TouchControls game={game} />
        </>
      )}

      {!started && (
        <div className="game-start">
          <div className="game-start__box">
            <PixelAvatar className="game-start__avatar" />
            <p className="game-start__eyebrow">{profile.name} presents</p>
            <h1 className="game-start__title">QA Quest</h1>
            <p className="game-start__sub">
              A tiny platformer about a <span className="accent">{profile.role}</span>. Explore the level to discover
              the portfolio.
            </p>
            <dl className="game-start__controls">
              <div>
                <dt>← → / A D</dt>
                <dd>Move</dd>
              </div>
              <div>
                <dt>Space / W</dt>
                <dd>Jump · squash bugs</dd>
              </div>
              <div>
                <dt>E / ↓</dt>
                <dd>Open houses, cabinets, flags</dd>
              </div>
              <div>
                <dt>M</dt>
                <dd>Quick menu</dd>
              </div>
            </dl>
            <div className="game-start__actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  sfx.powerUp()
                  setStarted(true)
                }}
                autoFocus
              >
                ▶ Press start
              </button>
              <button
                className="btn"
                onClick={() => {
                  setStarted(true)
                  setMenu(true)
                }}
              >
                ☰ Skip to menu
              </button>
            </div>
            <p className="game-start__blink">In a hurry? The menu opens any section directly.</p>
          </div>
        </div>
      )}

      {menu && (
        <div className="game-modal" onPointerDown={(e) => e.target === e.currentTarget && setMenu(false)}>
          <div className="window game-modal__window game-menu" role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
            <header className="window__bar">
              <span id="game-menu-title">PAUSE · QUICK MENU</span>
              <button className="game-modal__close" onClick={() => setMenu(false)} aria-label="Close (Esc)">
                ✕
              </button>
            </header>
            <div className="window__body">
              <p className="game-modal__text">Warp to any part of the level:</p>
              <ul className="game-menu__list">
                {ZONES.map((z) => (
                  <li key={z.id}>
                    <button onClick={() => navigate(z.id)}>
                      <span className="game-menu__icon">{z.icon}</span>
                      {z.label}
                      {explored.includes(z.id) && <span className="game-menu__check">✔</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn" onClick={() => setMenu(false)}>
                ▶ Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {panel && (
        <GamePanel panel={panel} onClose={closePanel} onNavigate={navigate} foundSkills={found} goalReached={goal} />
      )}

      <Toast key={toast?.id} toast={toast} />
    </div>
  )
}

// On-screen buttons for phones and tablets
function TouchControls({ game }) {
  const bind = (action) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      game.current?.press(action, true)
    },
    onPointerUp: () => game.current?.press(action, false),
    onPointerCancel: () => game.current?.press(action, false),
    onContextMenu: (e) => e.preventDefault(),
  })

  return (
    <div className="game-pad" aria-hidden="true">
      <div className="game-pad__dir">
        <button {...bind('left')}>◀</button>
        <button {...bind('right')}>▶</button>
      </div>
      <div className="game-pad__act">
        <button className="game-pad__b" {...bind('interact')}>
          B
        </button>
        <button className="game-pad__a" {...bind('jump')}>
          A
        </button>
      </div>
    </div>
  )
}
