import { useCallback, useEffect, useRef, useState } from 'react'
import { sfx } from '../sound.js'
import { INVADER as BUG_FRAMES, SHIP, drawSprite } from '../sprites.js'

// "Bug Invaders": a tiny Space Invaders where the enemies are bugs.
// Drawn on a 320x240 canvas that CSS scales up, so it looks pixelated.
// Move with the mouse / finger (or arrow keys); the ship fires automatically.

const W = 320
const H = 240
const COLS = 8
const ROWS = 4

function readColors(el) {
  const css = getComputedStyle(el)
  const v = (name) => css.getPropertyValue(name).trim()
  return {
    bg: v('--bg-alt'),
    ship: v('--accent-2'),
    bugs: [v('--accent-3'), v('--accent'), v('--accent-2'), v('--text')],
    shot: v('--accent'),
    enemyShot: v('--accent-3'),
    star: v('--text-muted'),
  }
}

function makeBugs(wave) {
  const bugs = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bugs.push({ x: 48 + c * 28, y: 28 + r * 20 + Math.min(wave - 1, 4) * 6, row: r, alive: true })
    }
  }
  return bugs
}

function newGame() {
  return {
    ship: { x: W / 2, invulnerable: 0 },
    targetX: W / 2,
    keys: { left: false, right: false },
    shots: [],
    enemyShots: [],
    particles: [],
    bugs: makeBugs(1),
    dir: 1,
    wave: 1,
    fireCooldown: 0,
    enemyCooldown: 1.2,
    frame: 0,
    frameTimer: 0,
  }
}

function loadHighScore() {
  try {
    return Number(localStorage.getItem('bug-invaders-hi')) || 0
  } catch {
    return 0
  }
}

export default function BugInvaders() {
  const canvasRef = useRef(null)
  const screenRef = useRef(null)
  const game = useRef(newGame())
  const colors = useRef(null)
  const stars = useRef(
    Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: 4 + Math.random() * 14,
    })),
  )

  const [status, setStatus] = useState('idle') // idle | playing | paused | over | won
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [hiScore, setHiScore] = useState(loadHighScore)
  const statusRef = useRef(status)
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  statusRef.current = status

  useEffect(() => {
    colors.current = readColors(canvasRef.current)
  }, [])

  const start = useCallback(() => {
    game.current = newGame()
    scoreRef.current = 0
    livesRef.current = 3
    setScore(0)
    setLives(3)
    setStatus('playing')
    screenRef.current?.focus({ preventScroll: true })
  }, [])

  // Continue with a harder wave, keeping score and lives
  const nextWave = useCallback(() => {
    const g = game.current
    g.wave += 1
    g.bugs = makeBugs(g.wave)
    g.shots = []
    g.enemyShots = []
    g.enemyCooldown = 1.2
    setStatus('playing')
    screenRef.current?.focus({ preventScroll: true })
  }, [])

  const saveHighScore = () => {
    if (scoreRef.current > loadHighScore()) {
      setHiScore(scoreRef.current)
      try {
        localStorage.setItem('bug-invaders-hi', String(scoreRef.current))
      } catch {
        // ignore
      }
    }
  }

  // Freezes the game (and its sounds) until the player resumes or quits
  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return
    statusRef.current = 'paused'
    game.current.keys = { left: false, right: false }
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    statusRef.current = 'playing'
    setStatus('playing')
    screenRef.current?.focus({ preventScroll: true })
  }, [])

  // Leaves the run and goes back to the title screen
  const quit = useCallback(() => {
    saveHighScore()
    game.current = newGame()
    statusRef.current = 'idle'
    setStatus('idle')
  }, [])

  // Ends the run: "over" when the player dies, "won" when every bug is squashed
  const endGame = useCallback((result = 'over') => {
    if (statusRef.current !== 'playing') return
    statusRef.current = result // stop the loop right away, before React re-renders
    setStatus(result)
    if (result === 'won') sfx.wave()
    else sfx.gameOver()
    saveHighScore()
  }, [])

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let last = performance.now()
    let onScreen = true

    // Pause automatically when the game scrolls out of view or the tab is hidden
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (!onScreen) pause()
    })
    io.observe(canvas)
    const onVisibility = () => {
      if (document.hidden) pause()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const update = (dt) => {
      const g = game.current
      const playing = statusRef.current === 'playing'

      // bug walking animation (also in attract mode)
      g.frameTimer += dt
      if (g.frameTimer > 0.45) {
        g.frameTimer = 0
        g.frame ^= 1
      }

      for (const s of stars.current) {
        s.y += s.s * dt
        if (s.y > H) {
          s.y = 0
          s.x = Math.random() * W
        }
      }

      for (const p of g.particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt
      }
      g.particles = g.particles.filter((p) => p.life > 0)

      if (!playing) return

      // ship movement: follow pointer, or keys
      const speed = 190
      if (g.keys.left) g.targetX -= speed * dt
      if (g.keys.right) g.targetX += speed * dt
      g.targetX = Math.max(8, Math.min(W - 8, g.targetX))
      const dx = g.targetX - g.ship.x
      g.ship.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * 1.4 * dt)
      g.ship.invulnerable = Math.max(0, g.ship.invulnerable - dt)

      // auto-fire
      g.fireCooldown -= dt
      if (g.fireCooldown <= 0) {
        const x = Math.round(g.ship.x)
        g.shots.push({ x, y: H - 22, vx: 0 })
        // debug-mode cheat (Konami code): triple shot
        if (document.documentElement.classList.contains('debug')) {
          g.shots.push({ x, y: H - 22, vx: -50 }, { x, y: H - 22, vx: 50 })
        }
        sfx.shoot()
        g.fireCooldown = 0.32
      }
      for (const s of g.shots) {
        s.y -= 240 * dt
        s.x += s.vx * dt
      }
      g.shots = g.shots.filter((s) => s.y > -6)

      // bug swarm movement
      const alive = g.bugs.filter((b) => b.alive)
      const swarmSpeed = 14 + g.wave * 5 + (COLS * ROWS - alive.length) * 1.1
      let hitEdge = false
      for (const b of alive) {
        b.x += g.dir * swarmSpeed * dt
        if (b.x < 6 || b.x > W - 17) hitEdge = true
      }
      if (hitEdge) {
        g.dir *= -1
        for (const b of alive) {
          b.x += g.dir * 2
          b.y += 6
        }
      }

      // enemy fire from a random bug
      g.enemyCooldown -= dt
      if (g.enemyCooldown <= 0 && alive.length) {
        const b = alive[Math.floor(Math.random() * alive.length)]
        g.enemyShots.push({ x: b.x + 5, y: b.y + 8 })
        g.enemyCooldown = Math.max(0.35, 1.1 - g.wave * 0.12) + Math.random() * 0.5
      }
      for (const s of g.enemyShots) s.y += (90 + g.wave * 10) * dt
      g.enemyShots = g.enemyShots.filter((s) => s.y < H)

      // player shots vs bugs
      for (const s of g.shots) {
        for (const b of alive) {
          if (b.alive && s.x >= b.x && s.x <= b.x + 11 && s.y >= b.y && s.y <= b.y + 8) {
            b.alive = false
            s.y = -100
            scoreRef.current += (ROWS - b.row) * 10
            setScore(scoreRef.current)
            sfx.explode()
            for (let i = 0; i < 8; i++) {
              g.particles.push({
                x: b.x + 5,
                y: b.y + 4,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                life: 0.35,
                row: b.row,
              })
            }
          }
        }
      }

      // enemy shots vs ship
      const shipTop = H - 18
      for (const s of g.enemyShots) {
        if (!g.ship.invulnerable && s.y >= shipTop && s.y <= H - 12 && Math.abs(s.x - g.ship.x) <= 6) {
          s.y = H + 10
          livesRef.current -= 1
          setLives(livesRef.current)
          g.ship.invulnerable = 1.2
          sfx.hurt()
          if (livesRef.current <= 0) endGame()
        }
      }

      // every bug squashed, or bugs reached the ship line
      if (alive.every((b) => !b.alive)) endGame('won')
      else if (alive.some((b) => b.alive && b.y + 8 >= shipTop)) endGame()
    }

    const draw = () => {
      const g = game.current
      const c = colors.current
      if (!c) return
      ctx.fillStyle = c.bg
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = c.star
      for (const s of stars.current) ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)

      for (const b of g.bugs) {
        if (b.alive) drawSprite(ctx, BUG_FRAMES[g.frame], Math.round(b.x), Math.round(b.y), c.bugs[b.row])
      }
      for (const p of g.particles) {
        ctx.fillStyle = c.bugs[p.row]
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2)
      }

      ctx.fillStyle = c.shot
      for (const s of g.shots) ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 4)
      ctx.fillStyle = c.enemyShot
      for (const s of g.enemyShots) ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 4)

      if (statusRef.current === 'playing' || statusRef.current === 'paused') {
        const blink = g.ship.invulnerable > 0 && Math.floor(g.ship.invulnerable * 10) % 2 === 0
        if (!blink) drawSprite(ctx, SHIP, Math.round(g.ship.x) - 5, H - 18, c.ship)
      }
    }

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (onScreen) {
        if (statusRef.current !== 'paused' && (!reduced || statusRef.current === 'playing')) update(dt)
        draw()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [endGame, pause])

  const onPointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    game.current.targetX = ((e.clientX - rect.left) / rect.width) * W
  }

  const onKey = (down) => (e) => {
    const k = e.key
    // Enter / Esc / P pause; Enter or P resume (only when the screen itself has focus,
    // so pressing Enter on the overlay buttons still clicks them)
    if (down && (k === 'Enter' || k === 'Escape' || k === 'p' || k === 'P')) {
      if (statusRef.current === 'playing') {
        e.preventDefault()
        pause()
      } else if (statusRef.current === 'paused' && k !== 'Escape' && e.target === e.currentTarget) {
        e.preventDefault()
        resume()
      }
      return
    }
    if (statusRef.current !== 'playing') return
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') game.current.keys.left = down
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') game.current.keys.right = down
    else return
    e.preventDefault()
  }

  const pad = (n) => String(n).padStart(4, '0')

  return (
    <div>
      <div className="arcade">
        <div className="arcade__bar">
          <span>
            Bugs squashed <strong>{pad(score)}</strong>
          </span>
          <span>
            HI <strong>{pad(hiScore)}</strong>
          </span>
          <span aria-label={`${lives} lives`}>
            <strong>{'♥'.repeat(Math.max(lives, 0))}</strong>
            {'♡'.repeat(Math.max(3 - lives, 0))}
          </span>
          {(status === 'playing' || status === 'paused') && (
            <button
              className="arcade__pause"
              onClick={status === 'playing' ? pause : resume}
              aria-label={status === 'playing' ? 'Pause game' : 'Resume game'}
            >
              {status === 'playing' ? '❚❚' : '▶'}
            </button>
          )}
        </div>
        <div
          ref={screenRef}
          className={`arcade__screen ${status === 'playing' ? 'is-playing' : ''}`}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onKeyDown={onKey(true)}
          onKeyUp={onKey(false)}
        >
          <canvas ref={canvasRef} width={W} height={H} aria-label="Bug Invaders mini-game" />
          {status !== 'playing' && (
            <div className={`arcade__overlay arcade__overlay--${status}`}>
              {status === 'idle' && (
                <>
                  <h3>Bug Invaders</h3>
                  <p>The build is full of bugs. Squash them before release.</p>
                  <button className="btn btn--primary" onClick={start}>
                    Start testing
                  </button>
                </>
              )}
              {status === 'paused' && (
                <>
                  <h3>Paused</h3>
                  <p>Testing on hold · {score} points</p>
                  <div className="arcade__actions">
                    <button className="btn btn--primary" onClick={resume}>
                      Resume
                    </button>
                    <button className="btn" onClick={quit}>
                      Quit game
                    </button>
                  </div>
                </>
              )}
              {status === 'over' && (
                <>
                  <h3>Try again</h3>
                  <p>
                    The bugs made it to release · {score} points
                    {score >= hiScore && score > 0 && <span className="accent"> · New high score!</span>}
                  </p>
                  <button className="btn btn--primary" onClick={start}>
                    Try again
                  </button>
                </>
              )}
              {status === 'won' && (
                <>
                  <h3>All bugs squashed!</h3>
                  <p>
                    The build is clean and ready for release · {score} points
                    {score >= hiScore && score > 0 && <span className="accent"> · New high score!</span>}
                  </p>
                  <div className="arcade__actions">
                    <button className="btn btn--primary" onClick={nextWave}>
                      Next build
                    </button>
                    <button className="btn" onClick={start}>
                      Restart
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="arcade__hint">Move with mouse, finger or ← →. Your ship fires automatically. Enter / Esc to pause.</p>
    </div>
  )
}
