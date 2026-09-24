import { games, skills } from '../../data/portfolio.js'
import { BEETLE, INVADER, drawSprite } from '../../sprites.js'
import { AVATAR_COLORS, avatarRows } from '../shared.jsx'
import { sfx } from '../../sound.js'
import { buildLevel, PAL } from './level.js'

// ------------------------------------------------------------
//  Tiny platformer engine drawn on a <canvas>.
//  createGame() returns an object the React side talks to:
//  input (press), pause, warp and destroy.
// ------------------------------------------------------------

const GRAVITY = 900
const JUMP_SPEED = 290
const RUN_SPEED = 95
const ACCEL = 900
const MAX_FALL = 420
const PLAYER_W = 12
const PLAYER_H = 20
const BUG_RESPAWN = 8
const FONT = '"Press Start 2P", monospace'

// Deterministic pseudo-random number in [0, 1)
function rand(i, k = 0) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

// Pre-renders a pixel sprite to a small canvas (1 sprite pixel = 1 canvas pixel)
function spriteCanvas(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'))
  return c
}

function avatarCanvas(blink) {
  return spriteCanvas(16, 20, (ctx) => {
    avatarRows(blink).forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return
        ctx.fillStyle = AVATAR_COLORS[ch]
        ctx.fillRect(x, y, 1, 1)
      }),
    )
  })
}

export function createGame(canvas, callbacks) {
  const ctx = canvas.getContext('2d')
  const level = buildLevel()
  const { objects, blocks, bugs, end } = level

  const sprites = {
    player: avatarCanvas(false),
    playerBlink: avatarCanvas(true),
    beetle: BEETLE.map((f) => spriteCanvas(11, 8, (c) => drawSprite(c, f, 0, 0, PAL.lime))),
    boss: INVADER.map((f) => spriteCanvas(11, 8, (c) => drawSprite(c, f, 0, 0, PAL.red))),
  }

  const covers = games.map((g) => {
    if (!g.image) return null
    const img = new Image()
    img.src = g.image
    return img
  })

  bugs.forEach((b) => {
    b.w = b.big ? 22 : 11
    b.h = b.big ? 16 : 8
    b.y = -b.h
    b.hp = b.big ? 3 : 1
    b.home = b.from
  })

  const player = { x: 20, y: -PLAYER_H, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, face: 1, ground: true, hurt: 0 }
  const input = { left: false, right: false, jump: false, jumpBuffer: 0, interact: false }
  const state = {
    time: 0,
    coyote: 0,
    cam: 0,
    scale: 3,
    viewW: 300,
    viewH: 200,
    groundY: 170,
    paused: true,
    near: null,
    bugsFixed: 0,
    skillsFound: 0,
    skillsTotal: skills.reduce((n, g) => n + g.items.length, 0),
    reachedGoal: false,
    blink: 0,
  }
  const floaters = []
  const particles = []
  let raf = 0
  let last = 0

  /* ---------- Sizing ---------- */
  function resize() {
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    state.scale = Math.max(2, Math.floor(Math.min(h / 170, w / 110)))
    state.dpr = dpr
    state.viewW = w / state.scale
    state.viewH = h / state.scale
    // On touch screens keep the ground above the on-screen buttons
    const reserved = callbacks.touch?.() ? 210 / state.scale : 30
    state.groundY = Math.floor(state.viewH - Math.max(30, reserved))
  }

  /* ---------- Update ---------- */
  function solidsNear() {
    return blocks
  }

  function hitBlock(b) {
    b.bump = 0.15
    if (b.hits >= b.items.length) {
      sfx.blip()
      return
    }
    const item = b.items[b.hits++]
    state.skillsFound++
    sfx.select()
    floaters.push({ text: `+ ${item}`, x: b.x + b.w / 2, y: b.y - 6, t: 0, color: PAL.yellow })
    callbacks.onSkill?.(item, state.skillsFound, state.skillsTotal, b.hits === b.items.length ? b.group : null)
  }

  function burst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      particles.push({ x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40, t: 0, color })
    }
  }

  function updatePlayer(dt) {
    const p = player
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const target = dir * RUN_SPEED
    const accel = p.ground ? ACCEL : ACCEL * 0.7
    if (p.vx < target) p.vx = Math.min(target, p.vx + accel * dt)
    else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * dt)
    if (dir) p.face = dir

    // Jump with a little "coyote time" and an input buffer
    state.coyote = p.ground ? 0.1 : state.coyote - dt
    input.jumpBuffer -= dt
    if (input.jumpBuffer > 0 && state.coyote > 0) {
      p.vy = -JUMP_SPEED
      p.ground = false
      state.coyote = 0
      input.jumpBuffer = 0
      sfx.jump()
    }
    // Releasing jump early makes a shorter jump
    if (!input.jump && p.vy < -110) p.vy = -110

    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt)
    if (p.hurt > 0) p.hurt -= dt

    // Horizontal move + collisions
    p.x += p.vx * dt
    for (const s of solidsNear()) {
      if (!overlap(p, s)) continue
      if (p.vx > 0) p.x = s.x - p.w
      else if (p.vx < 0) p.x = s.x + s.w
      p.vx = 0
    }
    p.x = Math.max(0, Math.min(end - p.w, p.x))

    // Vertical move + collisions
    p.y += p.vy * dt
    p.ground = false
    if (p.y + p.h >= 0) {
      p.y = -p.h
      p.vy = 0
      p.ground = true
    }
    for (const s of solidsNear()) {
      if (!overlap(p, s)) continue
      if (p.vy > 0) {
        p.y = s.y - p.h
        p.vy = 0
        p.ground = true
      } else if (p.vy < 0) {
        p.y = s.y + s.h
        p.vy = 0
        hitBlock(s)
      }
    }
  }

  function updateBugs(dt) {
    const p = player
    for (const b of bugs) {
      if (!b.alive) {
        b.dead += dt
        if (b.dead > BUG_RESPAWN * (b.big ? 2.5 : 1)) {
          b.alive = true
          b.hp = b.big ? 3 : 1
          b.x = b.home
        }
        continue
      }
      b.x += b.vx * dt
      if (b.x < b.from) {
        b.x = b.from
        b.vx = Math.abs(b.vx)
      } else if (b.x > b.to) {
        b.x = b.to
        b.vx = -Math.abs(b.vx)
      }
      if (b.flash > 0) b.flash -= dt

      if (!overlap(p, b)) continue
      const stomp = p.vy > 0 && p.y + p.h - b.y < 9
      if (stomp) {
        p.vy = -200
        b.hp--
        b.flash = 0.2
        if (b.hp <= 0) {
          b.alive = false
          b.dead = 0
          state.bugsFixed++
          sfx.stomp()
          burst(b.x + b.w / 2, b.y + b.h / 2, b.big ? PAL.red : PAL.lime, b.big ? 16 : 8)
          floaters.push({ text: 'FIXED!', x: b.x + b.w / 2, y: b.y - 8, t: 0, color: PAL.lime })
          callbacks.onBug?.(state.bugsFixed, b.big)
        } else {
          sfx.bossHit()
        }
      } else if (p.hurt <= 0) {
        p.hurt = 1
        p.vx = (p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1) * 160
        p.vy = -150
        sfx.hurt()
        floaters.push({ text: 'OUCH', x: p.x + p.w / 2, y: p.y - 8, t: 0, color: PAL.orange })
      }
    }
  }

  function updateWorld(dt) {
    for (const b of blocks) if (b.bump > 0) b.bump -= dt
    for (const f of floaters) {
      f.t += dt
      f.y -= 18 * dt
    }
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].t > 1.4) floaters.splice(i, 1)
    for (const q of particles) {
      q.t += dt
      q.vy += GRAVITY * 0.5 * dt
      q.x += q.vx * dt
      q.y += q.vy * dt
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].t > 0.8) particles.splice(i, 1)

    for (const o of objects) {
      if (o.type === 'flag' && o.visited) o.raise = Math.min(1, o.raise + dt * 1.5)
      if (o.type === 'pole' && state.reachedGoal) o.flag = Math.min(1, o.flag + dt * 0.8)
    }

    // Nearest object you can open
    const cx = player.x + player.w / 2
    let near = null
    let best = Infinity
    for (const o of objects) {
      if (!o.panel) continue
      if (cx < o.x - 6 || cx > o.x + o.w + 6) continue
      const d = Math.abs(cx - (o.x + o.w / 2))
      if (d < best) {
        best = d
        near = o
      }
    }
    if (near !== state.near) {
      state.near = near
      callbacks.onNear?.(near?.panel ?? null)
    }

    // Touching the flag pole finishes the level once
    const pole = objects.find((o) => o.type === 'pole')
    if (!state.reachedGoal && player.x + player.w > pole.x && player.x < pole.x + pole.w) {
      state.reachedGoal = true
      sfx.powerUp()
      for (let i = 0; i < 5; i++) burst(pole.x + rand(i) * 80, -60 - rand(i, 1) * 50, [PAL.yellow, PAL.cyan, PAL.lime][i % 3], 12)
      callbacks.onGoal?.()
    }
  }

  function updateCamera(dt) {
    const target = player.x + player.w / 2 - state.viewW * 0.42 + player.face * 16
    state.cam += (target - state.cam) * Math.min(1, dt * 5)
    state.cam = Math.max(0, Math.min(end - state.viewW, state.cam))
  }

  function update(dt) {
    state.time += dt
    state.blink -= dt
    if (state.blink < -4) state.blink = 0.15
    if (state.paused) return
    updatePlayer(dt)
    updateBugs(dt)
    updateWorld(dt)
    if (input.interact) {
      input.interact = false
      if (state.near) open(state.near.panel)
    }
  }

  /* ---------- Drawing helpers (all in world units) ---------- */
  const sx = (x) => Math.round(x - state.cam)
  const sy = (y) => Math.round(state.groundY + y)

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color
    ctx.fillRect(sx(x), sy(y), w, h)
  }

  function outlinedRect(x, y, w, h, fill, line = PAL.ink) {
    rect(x, y, w, h, line)
    rect(x + 1, y + 1, w - 2, h - 2, fill)
  }

  function text(str, x, y, size, color, align = 'center') {
    ctx.font = `${size}px ${FONT}`
    ctx.textAlign = align
    ctx.textBaseline = 'top'
    ctx.fillStyle = color
    ctx.fillText(str, sx(x), sy(y))
  }

  function label(str, x, y) {
    ctx.font = `4px ${FONT}`
    const w = Math.ceil(ctx.measureText(str).width) + 6
    outlinedRect(x - w / 2, y, w, 9, PAL.night)
    text(str, x, y + 3, 4, PAL.yellow)
  }

  /* ---------- Background ---------- */
  function drawBackground() {
    const { viewW, viewH, groundY, cam, time } = state
    const sky = ctx.createLinearGradient(0, 0, 0, groundY)
    sky.addColorStop(0, PAL.night)
    sky.addColorStop(1, PAL.navy)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, viewW, viewH)

    // Stars (twinkle)
    for (let i = 0; i < 70; i++) {
      const x = (((rand(i) * 2000 - cam * 0.05) % viewW) + viewW) % viewW
      const y = rand(i, 1) * (groundY - 40)
      const on = Math.sin(time * 2 + i) > -0.6
      if (on) {
        ctx.fillStyle = i % 9 === 0 ? PAL.yellow : PAL.light
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1)
      }
    }

    // Pixel moon with a couple of craters
    const moonX = Math.round(viewW * 0.78)
    const moonY = Math.round(groundY * 0.3)
    const MOON = ['..####..', '.######.', '###o####', '########', '#####o##', '#o######', '.######.', '..####..']
    MOON.forEach((row, r) =>
      [...row].forEach((c, k) => {
        if (c === '.') return
        ctx.fillStyle = c === 'o' ? '#e0b060' : PAL.yellow
        ctx.fillRect(moonX + k * 2, moonY + r * 2, 2, 2)
      }),
    )

    // Far mountains and near hills (parallax)
    const layers = [
      { speed: 0.2, base: 46, amp: 22, step: 6, color: PAL.navy, shade: '#223066' },
      { speed: 0.5, base: 18, amp: 10, step: 4, color: PAL.dark, shade: PAL.teal },
    ]
    for (const l of layers) {
      for (let x = 0; x < viewW + l.step; x += l.step) {
        const u = x + cam * l.speed
        const h = Math.round((l.base + l.amp * Math.sin(u * 0.012) + l.amp * 0.5 * Math.sin(u * 0.041)) / 2) * 2
        ctx.fillStyle = l.color
        ctx.fillRect(x - (u % l.step), groundY - h, l.step, h)
        ctx.fillStyle = l.shade
        ctx.fillRect(x - (u % l.step), groundY - h, l.step, 2)
      }
    }
  }

  function drawGround() {
    const { viewW, viewH, groundY, cam } = state
    ctx.fillStyle = PAL.dark
    ctx.fillRect(0, groundY, viewW, viewH - groundY)
    ctx.fillStyle = PAL.green
    ctx.fillRect(0, groundY, viewW, 4)
    ctx.fillStyle = PAL.lime
    ctx.fillRect(0, groundY, viewW, 1)
    // dirt specks, fixed to the world
    const start = Math.floor(cam / 8)
    for (let t = start; t < start + viewW / 8 + 2; t++) {
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = k === 0 ? PAL.gray : PAL.navy
        ctx.fillRect(Math.round(t * 8 - cam + rand(t, k) * 7), groundY + 7 + Math.floor(rand(t, k + 5) * (viewH - groundY - 9)), 2, 2)
      }
    }
  }

  /* ---------- Objects ---------- */
  function drawSign(o) {
    rect(o.x + o.w / 2 - 2, o.y + 18, 4, 12, PAL.purple)
    outlinedRect(o.x, o.y, o.w, 20, PAL.orange)
    rect(o.x + 1, o.y + 18, o.w - 2, 1, PAL.red)
    o.lines.forEach((l, i) => text(l, o.x + o.w / 2, o.y + 3 + i * 5, 4, PAL.ink))
  }

  function drawHouse(o) {
    const { x, y, w, h } = o
    // stepped pixel roof
    for (let i = 0; i < 6; i++) rect(x - 4 + i * 4, y + 18 - i * 4, w + 8 - i * 8, 4, i % 2 ? PAL.red : '#9a3348')
    rect(x - 4, y + 22, w + 8, 1, PAL.ink)
    outlinedRect(x + 2, y + 22, w - 4, h - 22, PAL.yellow)
    for (let r = 0; r < 4; r++) rect(x + 3, y + 30 + r * 8, w - 6, 1, PAL.orange)
    outlinedRect(x + w / 2 - 8, y + h - 24, 16, 24, PAL.purple)
    rect(x + w / 2 + 4, y + h - 13, 2, 2, PAL.yellow)
    outlinedRect(x + 10, y + 30, 16, 12, PAL.cyan)
    outlinedRect(x + w - 26, y + 30, 16, 12, PAL.cyan)
    rect(x + 17, y + 30, 1, 12, PAL.ink)
    rect(x + w - 19, y + 30, 1, 12, PAL.ink)
    label(o.label, x + w / 2, y - 12)
  }

  function drawFlag(o) {
    const colors = { work: PAL.yellow, study: PAL.cyan, locked: PAL.gray }
    const pole = o.x + 4
    rect(pole, o.y, 3, o.h, PAL.light)
    rect(pole - 1, o.y - 2, 5, 3, PAL.yellow)
    const flagY = o.y + 4 + (1 - o.raise) * (o.h - 22)
    const wave = Math.round(Math.sin(state.time * 6 + o.x) * 1)
    outlinedRect(pole + 3, flagY + wave, 18, 12, colors[o.kind] ?? PAL.white)
    if (o.kind === 'locked') text('?', pole + 12, flagY + wave + 4, 4, PAL.ink)
    outlinedRect(o.x - 4, -8, 32, 8, o.current ? PAL.green : PAL.navy)
    text(o.level, o.x + 12, -6, 4, PAL.white)
  }

  function drawTerminal(o) {
    const { x, w } = o
    outlinedRect(x, -14, w, 4, PAL.gray)
    rect(x + 3, -10, 3, 10, PAL.gray)
    rect(x + w - 6, -10, 3, 10, PAL.gray)
    outlinedRect(x + 6, -36, 28, 22, PAL.dark)
    rect(x + 8, -34, 24, 16, PAL.ink)
    const blinkOn = Math.floor(state.time * 2) % 2
    for (let i = 0; i < 4; i++) rect(x + 10, -32 + i * 4, 6 + ((i * 7) % 12), 2, i === 0 ? PAL.red : PAL.green)
    if (blinkOn) rect(x + 26, -20, 3, 2, PAL.green)
    rect(x + 16, -14, 8, 2, PAL.dark)
    label(o.label, x + w / 2, -50)
  }

  const CABINET_COLORS = [PAL.blue, PAL.purple, PAL.teal, PAL.red]

  function drawCabinet(o) {
    const { x, y, w, h } = o
    const body = CABINET_COLORS[o.color]
    outlinedRect(x, y, w, h, body)
    outlinedRect(x - 1, y, w + 2, 8, PAL.yellow)
    text(String(o.index + 1).padStart(2, '0'), x + w / 2, y + 2, 4, PAL.ink)
    // screen with the game cover (pixelated on purpose)
    outlinedRect(x + 2, y + 9, w - 4, 17, PAL.ink)
    const img = covers[o.index]
    if (img?.complete && img.naturalWidth) {
      const dw = w - 6
      const dh = 15
      const ratio = dw / dh
      const sh = img.naturalHeight
      const sw = Math.min(img.naturalWidth, sh * ratio)
      ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, sh, sx(x + 3), sy(y + 10), dw, dh)
    } else {
      rect(x + 3, y + 10, w - 6, 15, PAL.navy)
    }
    // scanline flicker
    if (Math.sin(state.time * 3 + o.index) > 0.9) rect(x + 3, y + 10 + ((state.time * 30) % 15), w - 6, 1, 'rgba(244,244,244,0.4)')
    // control panel
    outlinedRect(x - 2, y + 27, w + 4, 6, PAL.dark)
    rect(x + 7, y + 25, 2, 3, PAL.ink)
    rect(x + 6, y + 24, 4, 2, PAL.red)
    rect(x + 16, y + 29, 3, 2, PAL.yellow)
    rect(x + 21, y + 29, 3, 2, PAL.cyan)
    rect(x + 4, y + 36, w - 8, 1, PAL.ink)
    rect(x + 8, y + 40, w - 16, 5, PAL.ink)
    rect(x + 10, y + 42, 3, 1, PAL.orange)
  }

  function drawBlock(b) {
    const used = b.hits >= b.items.length
    const lift = b.bump > 0 ? -3 : 0
    const y = b.y + lift
    outlinedRect(b.x, y, b.w, b.h, used ? PAL.gray : PAL.yellow)
    if (!used) {
      rect(b.x + 1, y + 1, b.w - 2, 1, '#fff2c4')
      // pixel "?"
      const q = ['.###.', '#...#', '...#.', '..#..', '.....', '..#..']
      q.forEach((row, r) => [...row].forEach((c, k) => c === '#' && rect(b.x + 5 + k, y + 4 + r, 1, 1, PAL.orange)))
    } else {
      rect(b.x + 3, y + 3, 2, 2, PAL.dark)
      rect(b.x + b.w - 5, y + 3, 2, 2, PAL.dark)
      rect(b.x + 3, y + b.h - 5, 2, 2, PAL.dark)
      rect(b.x + b.w - 5, y + b.h - 5, 2, 2, PAL.dark)
    }
    label(`${b.group.split(' ')[0].toUpperCase()} ${b.hits}/${b.items.length}`, b.x + b.w / 2, b.y - 14)
  }

  function drawWorkshop(o) {
    const { x, w } = o
    outlinedRect(x, -18, w, 4, PAL.orange)
    rect(x + 3, -14, 3, 14, PAL.purple)
    rect(x + w - 6, -14, 3, 14, PAL.purple)
    // laptop with code
    outlinedRect(x + 6, -32, 22, 14, PAL.dark)
    rect(x + 8, -30, 18, 10, PAL.ink)
    for (let i = 0; i < 3; i++) rect(x + 10 + (i % 2) * 2, -28 + i * 3, 8 + i * 2, 1, [PAL.cyan, PAL.yellow, PAL.lime][i])
    outlinedRect(x + 4, -19, 26, 2, PAL.light)
    // spinning "Blender" cube
    const cx = x + 44
    const cy = -30
    const a = state.time * 1.5
    const pts = []
    for (const [px, py, pz] of [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ]) {
      const rx = px * Math.cos(a) - pz * Math.sin(a)
      const rz = px * Math.sin(a) + pz * Math.cos(a)
      const ry = py * Math.cos(0.5) - rz * Math.sin(0.5)
      pts.push([cx + rx * 6, cy + ry * 6])
    }
    ctx.strokeStyle = PAL.orange
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
      ctx.moveTo(pts[i][0] - state.cam, state.groundY + pts[i][1])
      ctx.lineTo(pts[j][0] - state.cam, state.groundY + pts[j][1])
    }
    ctx.stroke()
    label(o.label, x + w / 2, -54)
  }

  function drawPole(o) {
    rect(o.x + 2, o.y, 4, o.h, PAL.light)
    rect(o.x, o.y - 6, 8, 8, PAL.yellow)
    rect(o.x - 4, -6, 16, 6, PAL.gray)
    const fy = o.y + 8 + (1 - o.flag) * (o.h - 26)
    outlinedRect(o.x - 22, fy, 24, 16, state.reachedGoal ? PAL.lime : PAL.red)
    text(state.reachedGoal ? '✓' : '!', o.x - 10, fy + 6, 4, PAL.ink)
  }

  function drawCastle(o) {
    const { x, y, w, h } = o
    const brick = PAL.gray
    outlinedRect(x, y + 30, w, h - 30, brick)
    outlinedRect(x + 25, y + 6, w - 50, 26, brick)
    for (let i = 0; i < 5; i++) outlinedRect(x + i * 22, y + 24, 12, 8, brick)
    for (let i = 0; i < 3; i++) outlinedRect(x + 25 + i * 20, y, 10, 8, brick)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) rect(x + 4 + c * 12 + (r % 2) * 6, y + 36 + r * 7, 6, 1, PAL.dark)
    }
    outlinedRect(x + w / 2 - 12, y + h - 30, 24, 30, PAL.ink)
    rect(x + w / 2 - 12, y + h - 30, 24, 4, PAL.dark)
    outlinedRect(x + w / 2 - 5, y + 12, 10, 12, PAL.yellow)
    label(o.label, x + w / 2, y - 16)
  }

  const DRAW = {
    sign: drawSign,
    house: drawHouse,
    flag: drawFlag,
    terminal: drawTerminal,
    cabinet: drawCabinet,
    workshop: drawWorkshop,
    pole: drawPole,
    castle: drawCastle,
  }

  /* ---------- Characters & effects ---------- */
  function drawBugs() {
    const frame = Math.floor(state.time * 4) % 2
    for (const b of bugs) {
      if (!b.alive) continue
      if (b.x + b.w < state.cam - 10 || b.x > state.cam + state.viewW + 10) continue
      const img = (b.big ? sprites.boss : sprites.beetle)[frame]
      if (b.flash > 0 && Math.floor(state.time * 30) % 2) continue
      ctx.drawImage(img, sx(b.x), sy(b.y), b.w, b.h)
      if (b.big) {
        for (let i = 0; i < 3; i++) rect(b.x + 3 + i * 6, b.y - 5, 4, 3, i < b.hp ? PAL.red : PAL.dark)
      }
    }
  }

  function drawPlayer() {
    const p = player
    if (p.hurt > 0 && Math.floor(state.time * 20) % 2) return
    const walking = p.ground && Math.abs(p.vx) > 10
    const bob = walking && Math.floor(state.time * 10) % 2 ? -1 : 0
    const img = state.blink > 0 ? sprites.playerBlink : sprites.player
    const x = sx(p.x - 2)
    const y = sy(p.y + bob)
    ctx.save()
    if (p.face < 0) {
      ctx.translate(x + 16, y)
      ctx.scale(-1, 1)
      ctx.drawImage(img, 0, 0)
    } else {
      ctx.drawImage(img, x, y)
    }
    ctx.restore()
  }

  function drawPrompt() {
    const o = state.near
    if (!o || state.paused) return
    const bob = Math.floor(state.time * 3) % 2
    const x = player.x + player.w / 2
    const y = player.y - 16 - bob
    outlinedRect(x - 5, y, 11, 10, PAL.white)
    text(callbacks.touch?.() ? 'B' : 'E', x + 0.5, y + 3, 4, PAL.ink)
  }

  function drawEffects() {
    for (const q of particles) rect(q.x, q.y, 2, 2, q.color)
    for (const f of floaters) {
      const alpha = Math.max(0, 1 - f.t / 1.4)
      ctx.globalAlpha = alpha
      ctx.font = `4px ${FONT}`
      const w = Math.ceil(ctx.measureText(f.text).width) + 6
      outlinedRect(f.x - w / 2, f.y, w, 9, PAL.night)
      text(f.text, f.x, f.y + 3, 4, f.color)
      ctx.globalAlpha = 1
    }
  }

  function draw() {
    const k = state.scale * state.dpr
    ctx.setTransform(k, 0, 0, k, 0, 0)
    ctx.imageSmoothingEnabled = false
    drawBackground()
    drawGround()
    const left = state.cam - 120
    const right = state.cam + state.viewW + 20
    for (const o of objects) if (o.x + o.w > left && o.x < right) DRAW[o.type](o)
    for (const b of blocks) if (b.x + b.w > left && b.x < right) drawBlock(b)
    drawBugs()
    drawPlayer()
    drawEffects()
    drawPrompt()
  }

  /* ---------- Loop & API ---------- */
  function frame(t) {
    const dt = Math.min(0.033, (t - (last || t)) / 1000)
    last = t
    update(dt)
    updateCamera(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }

  function open(panel) {
    const [zone] = panel.split(':')
    if (zone === 'journey' || zone === 'locked') {
      const flag = objects.find((o) => o.panel === panel)
      if (flag) flag.visited = true
    }
    input.left = input.right = input.jump = false
    callbacks.onOpen?.(panel)
  }

  resize()
  state.cam = 0
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(frame)

  return {
    press(action, down) {
      if (action === 'jump') {
        if (down && !input.jump) input.jumpBuffer = 0.12
        input.jump = down
      } else if (action === 'interact') {
        if (down) input.interact = true
      } else {
        input[action] = down
      }
    },
    setPaused(value) {
      state.paused = value
      if (value) {
        input.left = input.right = input.jump = false
        input.interact = false
      }
    },
    // Moves the player next to a zone or object (used by the quick menu)
    warp(panel) {
      const [zone, index] = panel.split(':')
      const target =
        objects.find((o) => o.panel === panel) ??
        (zone === 'games' ? objects.find((o) => o.panel === 'game:0') : null) ??
        (index == null && level.zoneX[zone] != null ? { x: level.zoneX[zone], w: 0 } : null)
      if (!target) return
      player.x = Math.max(0, target.x + target.w / 2 - player.w / 2 - 20)
      player.y = -player.h
      player.vx = player.vy = 0
      player.face = 1
      state.cam = Math.max(0, Math.min(end - state.viewW, player.x - state.viewW * 0.42))
    },
    progress() {
      return player.x / end
    },
    zones() {
      return Object.entries(level.zoneX).map(([id, x]) => ({ id, at: x / end }))
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}
