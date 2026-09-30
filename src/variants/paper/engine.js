import * as THREE from 'three'
import { games, journey, skills } from '../../data/portfolio.js'
import { sfx } from '../../sound.js'
import { PAL } from '../game/level.js'
import * as art from './art.js'

// ------------------------------------------------------------
//  "Paper world": a 3D diorama (three.js) where characters,
//  buildings and items are flat pixel-art cut-outs, like a
//  Paper Mario level. createPaperGame() returns the same kind of
//  API as the 2D game: press, setPaused, warp, progress, zones…
//
//  Units: 1 world unit = 16 texels. y is up, the ground is y = 0,
//  x runs along the level and +z points towards the camera.
// ------------------------------------------------------------

const GRAVITY = 32
const JUMP_SPEED = 11.5
const JUMP_CUT = 6
const RUN_SPEED = 5.5
const ACCEL = 45
const Z_MIN = -2.4
const Z_MAX = 3.2
const BLOCK_Y = 2.1 // bottom of the ? blocks
const PLAYER_H = 22 / art.TEXELS
const BUG_RESPAWN = 8
const POP_AHEAD = 14 // cut-outs unfold when the player gets this close
const CAM_LEAD = 1.4 // the camera looks a bit ahead of the player
const FACADE_OPEN = -1.9 // radians a building front swings open

const ease = (t) => 1 - (1 - t) ** 3
const easeBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2

/* ---------- Level layout ---------- */
function buildLayout() {
  const objects = []
  const blocks = []
  const bugs = []
  const zoneX = {}
  let x = 3

  const sign = (title, lines, panel) => objects.push({ type: 'sign', x, z: -2.9, title, lines, panel })
  const bug = (from, to, z, big = false) => bugs.push({ from, to, z, big })

  sign('START', ['← → ↑ ↓ / WASD · move', 'Space · jump, squash bugs', 'E · open doors & things'])
  bug(x + 3, x + 8, 1.6)
  x += 8

  zoneX.about = x
  objects.push({ type: 'house', x, z: -4.2, panel: 'about', label: 'Profile' })
  x += 8

  zoneX.journey = x
  sign('JOURNEY', ['World map of my career.', 'Each flag is one level.'])
  x += 3.5
  journey.forEach((j, i) => {
    objects.push({ type: 'flag', x, z: -3.2, panel: `journey:${i}`, text: j.level, kind: j.type, label: `Level ${j.level}` })
    x += 3
  })
  objects.push({ type: 'flag', x, z: -3.2, panel: 'locked', text: '???', kind: 'locked', label: 'Level ???' })
  bug(x - 8, x - 1, 0.4)
  x += 5

  zoneX.report = x
  objects.push({ type: 'terminal', x, z: -3.2, panel: 'report', label: 'Bug report' })
  bug(x + 1, x + 7, 0.6, true)
  x += 11

  zoneX.games = x
  sign('ARCADE', [`${games.length} games I’ve tested.`, 'Each cabinet is one.'], 'games')
  x += 3.5
  games.forEach((g, i) => {
    objects.push({ type: 'cabinet', x, z: -3.4, panel: `game:${i}`, index: i, label: g.title })
    x += 2
  })
  bug(x - 14, x - 2, 1.8)
  x += 3

  zoneX.skills = x
  sign('SKILLS', ['Jump under the ? blocks', 'to unlock my skills.'], 'skills')
  x += 4
  skills.forEach((g) => {
    blocks.push({ x, z: 0.9, group: g.group, items: g.items })
    x += 4.5
  })
  bug(x - 12, x - 3, 2.2)
  x += 1

  zoneX.dev = x
  objects.push({ type: 'workshop', x, z: -4, panel: 'dev', label: 'Dev & 3D' })
  bug(x + 3, x + 8, 0.8)
  x += 9

  zoneX.contact = x
  sign('GOAL', ['Touch the flag pole', 'to finish the level!'], 'contact')
  x += 4
  objects.push({ type: 'pole', x, z: 0.2, panel: 'contact', label: 'Contact' })
  x += 6
  objects.push({ type: 'castle', x, z: -4.6, panel: 'contact', label: 'Contact' })
  x += 8

  return { objects, blocks, bugs, zoneX, end: x }
}

export function createPaperGame(canvas, overlay, callbacks) {
  const layout = buildLayout()
  const { objects, blocks, end } = layout

  /* ---------- three.js setup ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.BasicShadowMap // hard, pixel-looking shadows
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200)

  // Everything created here is disposed on destroy()
  const trash = []
  const keep = (...items) => {
    trash.push(...items)
    return items[0]
  }
  const sky = keep(art.skyTexture())
  scene.background = sky

  scene.add(new THREE.AmbientLight(0xffffff, 1.6))
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.8)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 14, bottom: -14, near: 1, far: 50 })
  sun.shadow.bias = -0.0015
  scene.add(sun, sun.target)

  /* ---------- Paper cut-out meshes ---------- */
  // A plane with its pivot at the bottom center (or the left edge for hinged fronts)
  function paperMesh(a, { hinge = false, shadow = true } = {}) {
    const geo = keep(new THREE.PlaneGeometry(a.w, a.h))
    geo.translate(hinge ? a.w / 2 : 0, a.h / 2, 0)
    const mat = keep(new THREE.MeshBasicMaterial({ map: a.tex, alphaTest: 0.5, side: THREE.DoubleSide }))
    keep(a.tex)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = shadow
    return mesh
  }

  // Group standing on the ground that can fold flat and pop up
  function standee(x, z, poppable = true) {
    const pivot = new THREE.Group()
    pivot.position.set(x, 0, z)
    scene.add(pivot)
    return { pivot, pop: poppable ? 0 : 1, poppable }
  }

  const shadowTex = keep(art.shadowTexture())
  const shadowMat = keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.28, depthWrite: false }))
  const shadowGeo = keep(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2))
  function blobShadow(size) {
    const m = new THREE.Mesh(shadowGeo, shadowMat)
    m.scale.setScalar(size)
    m.position.y = 0.02
    scene.add(m)
    return m
  }

  /* ---------- Ground: a thick grass slab with a dirt edge + a path ---------- */
  const x0 = -10
  const width = end + 20
  const depthBack = -10
  const depthFront = 4.6
  const depth = depthFront - depthBack
  const tiled = (make, rx, ry) => {
    const t = keep(make())
    t.repeat.set(rx, ry)
    return t
  }
  const lambert = (map) => keep(new THREE.MeshLambertMaterial({ map }))
  const dirtFront = lambert(tiled(art.dirtTexture, width, 1))
  const dirtSide = lambert(tiled(art.dirtTexture, depth, 1))
  const grass = lambert(tiled(art.grassTexture, width, depth))
  const ground = new THREE.Mesh(keep(new THREE.BoxGeometry(width, 1, depth)), [
    dirtSide,
    dirtSide,
    grass,
    dirtFront,
    dirtFront,
    dirtFront,
  ])
  ground.position.set(x0 + width / 2, -0.5, depthBack + depth / 2)
  ground.receiveShadow = true
  scene.add(ground)

  const path = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(width, 2.8).rotateX(-Math.PI / 2)),
    lambert(tiled(art.pathTexture, width, 2.8)),
  )
  path.position.set(x0 + width / 2, 0.005, 0.5)
  path.receiveShadow = true
  scene.add(path)

  // Flat meadow behind the slab so the horizon never shows gaps
  const meadow = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(width + 80, 60).rotateX(-Math.PI / 2)),
    lambert(tiled(art.grassTexture, (width + 80) / 2, 30)),
  )
  meadow.position.set(x0 + width / 2, -0.01, depthBack - 30)
  scene.add(meadow)

  // River in front of the diorama (its texture scrolls in animate)
  const waterTex = tiled(art.waterTexture, (width + 80) / 2, 15)
  const water = new THREE.Mesh(keep(new THREE.PlaneGeometry(width + 80, 30).rotateX(-Math.PI / 2)), lambert(waterTex))
  water.position.set(x0 + width / 2, -0.6, depthFront + 15)
  water.receiveShadow = true
  scene.add(water)

  /* ---------- Decoration ---------- */
  const deco = []
  const cloudList = []
  for (let i = 0; x0 + i * 13 < end + 10; i++) {
    const hill = paperMesh(art.hillArt(i), { shadow: false })
    hill.position.set(x0 + i * 13 + art.rand(i, 7) * 4, 0, -18 - art.rand(i, 8) * 4)
    hill.scale.setScalar(1.3)
    scene.add(hill)
  }
  for (let i = 0; x0 + i * 16 < end + 10; i++) {
    const cloud = paperMesh(art.cloudArt(i), { shadow: false })
    cloud.position.set(x0 + i * 16 + art.rand(i, 9) * 6, 5.5 + art.rand(i, 10) * 3, -28)
    cloud.scale.setScalar(1.8)
    scene.add(cloud)
    cloudList.push({ mesh: cloud, home: cloud.position.x, speed: 0.2 + art.rand(i, 11) * 0.3 })
  }
  const treeArt = [art.treeArt(0), art.treeArt(1)]
  for (let i = 0; x0 + i * 3.8 < end + 10; i++) {
    const s = standee(x0 + i * 3.8 + art.rand(i, 12) * 2, -7.5 - art.rand(i, 13) * 2)
    const tree = paperMesh(treeArt[i % 2])
    tree.scale.setScalar(1 + art.rand(i, 14) * 0.4)
    s.pivot.add(tree)
    deco.push(s)
  }
  const bushArt = [art.bushArt(0), art.bushArt(1), art.bushArt(2)]
  const flowerArt = [0, 1, 2, 3].map(art.flowerArt)
  for (let i = 0; x0 + i * 4.5 < end + 10; i++) {
    const s = standee(x0 + i * 4.5 + art.rand(i, 15) * 3, 3.9 + art.rand(i, 16) * 0.4)
    s.pivot.add(paperMesh(bushArt[i % 3]))
    deco.push(s)
  }
  for (let i = 0; i < (end + 10) / 2.4; i++) {
    const side = art.rand(i, 17) > 0.5
    const s = standee(x0 + i * 2.4 + art.rand(i, 18) * 1.5, side ? 2.2 + art.rand(i, 19) * 1.4 : -1.4 - art.rand(i, 19) * 1.2)
    s.pivot.add(paperMesh(flowerArt[i % 4], { shadow: false }))
    deco.push(s)
  }

  /* ---------- Level objects ---------- */
  const covers = games.map((g) => {
    if (!g.image) return null
    const img = new Image()
    img.src = g.image
    return img
  })

  const buildingArt = { house: art.houseArt, workshop: art.workshopArt, castle: art.castleArt }
  let pole = null

  for (const o of objects) {
    Object.assign(o, standee(o.x, o.z))
    o.openT = 0
    o.openTarget = 0
    if (buildingArt[o.type]) {
      // Front that swings open like a door, with the room drawn behind it
      const front = buildingArt[o.type](false)
      const inside = paperMesh(buildingArt[o.type](true))
      inside.position.z = -0.03
      o.facade = paperMesh(front, { hinge: true })
      o.facade.position.x = -front.w / 2
      o.pivot.add(inside, o.facade)
      o.reach = front.w / 2
    } else if (o.type === 'sign') {
      o.pivot.add(paperMesh(art.signArt(o.title)))
      o.reach = 1.3
    } else if (o.type === 'flag') {
      o.pivot.add(paperMesh(art.poleArt(64)))
      o.cloth = paperMesh(art.flagArt(o.text, o.kind))
      o.cloth.position.set(0.8, 0.5, 0.01)
      o.pivot.add(o.cloth)
      o.raise = 0
      o.reach = 1.1
    } else if (o.type === 'terminal') {
      o.screens = [art.terminalArt(false), art.terminalArt(true)]
      o.mesh = paperMesh(o.screens[1])
      keep(o.screens[0].tex)
      o.pivot.add(o.mesh)
      o.reach = 1.5
    } else if (o.type === 'cabinet') {
      o.art = art.cabinetArt(o.index, covers[o.index])
      o.mesh = paperMesh(o.art)
      o.pivot.add(o.mesh)
      o.reach = 0.9
      covers[o.index]?.addEventListener('load', () => o.art.redraw(covers[o.index]))
    } else if (o.type === 'pole') {
      o.pivot.add(paperMesh(art.poleArt(112)))
      o.cloth = paperMesh(art.flagArt('QA', 'goal'))
      o.cloth.position.set(0.8, 0.6, 0.01)
      o.pivot.add(o.cloth)
      o.raise = 0
      o.reach = 1
      pole = o
    }
  }

  /* ---------- ? blocks (the only real 3D boxes) ---------- */
  const blockGeo = keep(new THREE.BoxGeometry(1, 1, 1))
  const blockMat = lambert(keep(art.blockTexture(false)))
  const usedMat = lambert(keep(art.blockTexture(true)))
  for (const b of blocks) {
    b.hits = 0
    b.bump = 0
    b.mesh = new THREE.Mesh(blockGeo, blockMat)
    b.mesh.position.set(b.x, BLOCK_Y + 0.5, b.z)
    b.mesh.castShadow = b.mesh.receiveShadow = true
    scene.add(b.mesh)
    blobShadow(1.1).position.set(b.x, 0.02, b.z) // helps to aim the jump
  }

  /* ---------- Player ---------- */
  const playerArt = [art.avatarArt(false), art.avatarArt(true)]
  keep(playerArt[1].tex)
  const player = {
    x: 0, y: 0, z: 1, vx: 0, vy: 0, vz: 0, face: 1, angle: 0, ground: true, hurt: 0, squash: 0, walk: 0,
    group: new THREE.Group(),
    mesh: paperMesh(playerArt[0]),
    shadow: blobShadow(0.9),
  }
  player.group.add(player.mesh)
  scene.add(player.group)

  /* ---------- Bugs ---------- */
  const bugArt = [art.bugArt(false), art.bugArt(true)]
  const bugMats = bugArt.map((frames) =>
    frames.map((a) => keep(new THREE.MeshBasicMaterial({ map: keep(a.tex), alphaTest: 0.5, side: THREE.DoubleSide }))),
  )
  const bugGeo = bugArt.map(([a]) => keep(new THREE.PlaneGeometry(a.w, a.h).translate(0, a.h / 2, 0)))
  const bugs = layout.bugs.map((b, i) => {
    const scale = b.big ? 2.6 : 1.4
    const mesh = new THREE.Mesh(bugGeo[b.big ? 1 : 0], bugMats[b.big ? 1 : 0][0])
    mesh.castShadow = true
    mesh.scale.setScalar(scale)
    const group = new THREE.Group()
    group.add(mesh)
    scene.add(group)
    return {
      ...b,
      x: b.from,
      zNow: b.z,
      vx: b.big ? 2 : 1.6 + (i % 3) * 0.3,
      alive: true,
      hp: b.big ? 3 : 1,
      dead: 0,
      flash: 0,
      squash: 0,
      angle: 0,
      radius: b.big ? 1 : 0.5,
      height: (10 / art.TEXELS) * scale,
      big: b.big,
      mesh,
      group,
      shadow: blobShadow(b.big ? 2 : 1),
      phase: i * 1.7,
    }
  })

  /* ---------- Effects: popping stars, confetti, floating text ---------- */
  const starArt = art.starArt()
  const starMat = keep(new THREE.MeshBasicMaterial({ map: keep(starArt.tex), alphaTest: 0.5, side: THREE.DoubleSide }))
  const starGeo = keep(new THREE.PlaneGeometry(starArt.w, starArt.h).translate(0, starArt.h / 2, 0))
  const stars = []

  const bitGeo = keep(new THREE.PlaneGeometry(0.16, 0.16))
  const bitMats = {}
  const bits = []
  function burst(x, y, z, colors, count = 10, speed = 5) {
    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length]
      bitMats[color] ??= keep(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }))
      const m = new THREE.Mesh(bitGeo, bitMats[color])
      m.position.set(x, y, z)
      scene.add(m)
      const a = (i / count) * Math.PI * 2
      bits.push({ m, vx: Math.cos(a) * speed * 0.6, vy: 3 + Math.random() * speed, vz: Math.sin(a) * speed * 0.4, t: 0, spin: Math.random() * 10 })
    }
  }

  const floaters = []
  function floatText(text, x, y, z, color) {
    const el = document.createElement('span')
    el.className = 'paper-float'
    el.textContent = text
    el.style.color = color
    overlay.append(el)
    floaters.push({ el, x, y, z, t: 0 })
  }

  const prompt = document.createElement('div')
  prompt.className = 'paper-prompt'
  const bubble = document.createElement('div')
  bubble.className = 'paper-bubble'
  overlay.append(prompt, bubble)

  /* ---------- State ---------- */
  const input = { left: false, right: false, up: false, down: false, jump: false, jumpBuffer: 0, interact: false }
  const state = {
    time: 0,
    paused: true,
    coyote: 0,
    blink: 0,
    near: null,
    pending: null,
    bugsFixed: 0,
    skillsFound: 0,
    skillsTotal: skills.reduce((n, g) => n + g.items.length, 0),
    reachedGoal: false,
    cam: new THREE.Vector3(0, 0, 1),
    viewW: 1,
    viewH: 1,
    portrait: false,
  }
  let raf = 0
  let last = 0

  /* ---------- Sizing: render small, scale up = chunky pixels ---------- */
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const px = Math.max(2, Math.round(Math.min(h, w * 0.75) / 300))
    renderer.setPixelRatio(1)
    renderer.setSize(Math.ceil(w / px), Math.ceil(h / px), false)
    state.viewW = w
    state.viewH = h
    state.portrait = h > w
    camera.aspect = w / h
    camera.fov = state.portrait ? 50 : 32
    camera.updateProjectionMatrix()
  }

  /* ---------- Gameplay ---------- */
  function open(o) {
    if (o.type === 'flag') o.visited = true
    if (o.type === 'cabinet') o.hop = 0.35
    callbacks.onOpen?.(o.panel)
  }

  function interact() {
    const o = state.near
    if (!o?.panel || state.pending) return
    if (o.facade) {
      // swing the front open first, then show the window
      o.openTarget = 1
      state.pending = { o, t: 0.45 }
      sfx.blip()
    } else {
      open(o)
    }
  }

  function hitBlock(b) {
    b.bump = 1
    if (b.hits >= b.items.length) {
      sfx.blip()
      return
    }
    const item = b.items[b.hits++]
    state.skillsFound++
    sfx.select()
    const star = new THREE.Mesh(starGeo, starMat)
    star.position.set(b.x, BLOCK_Y + 1, b.z)
    scene.add(star)
    stars.push({ m: star, t: 0 })
    floatText(`+ ${item}`, b.x, BLOCK_Y + 2.4, b.z, PAL.yellow)
    if (b.hits === b.items.length) b.mesh.material = usedMat
    callbacks.onSkill?.(item, state.skillsFound, state.skillsTotal, b.hits === b.items.length ? b.group : null)
  }

  function updatePlayer(dt) {
    const p = player
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    let dz = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    const len = Math.hypot(dx, dz)
    if (len > 1) {
      dx /= len
      dz /= len
    }
    const accel = (p.ground ? ACCEL : ACCEL * 0.6) * dt
    const approach = (v, target) => (v < target ? Math.min(target, v + accel) : Math.max(target, v - accel))
    if (p.hurt <= 0.6) {
      p.vx = approach(p.vx, dx * RUN_SPEED)
      p.vz = approach(p.vz, dz * RUN_SPEED * 0.8)
    }
    if (dx) p.face = Math.sign(dx)

    // Jump with coyote time, an input buffer and a shorter hop on early release
    state.coyote = p.ground ? 0.1 : state.coyote - dt
    input.jumpBuffer -= dt
    if (input.jumpBuffer > 0 && state.coyote > 0) {
      p.vy = JUMP_SPEED
      p.ground = false
      state.coyote = 0
      input.jumpBuffer = 0
      sfx.jump()
    }
    if (!input.jump && p.vy > JUMP_CUT) p.vy = JUMP_CUT
    p.vy -= GRAVITY * dt
    if (p.hurt > 0) p.hurt -= dt

    const prevHead = p.y + PLAYER_H
    p.x = Math.max(-2, Math.min(end - 1, p.x + p.vx * dt))
    p.z = Math.max(Z_MIN, Math.min(Z_MAX, p.z + p.vz * dt))
    p.y += p.vy * dt

    // Head-butting a ? block from below
    if (p.vy > 0 && prevHead <= BLOCK_Y && p.y + PLAYER_H > BLOCK_Y) {
      const b = blocks.find((k) => Math.abs(k.x - p.x) < 0.9 && Math.abs(k.z - p.z) < 1)
      if (b) {
        p.y = BLOCK_Y - PLAYER_H
        p.vy = -1
        hitBlock(b)
      }
    }

    if (p.y <= 0) {
      if (!p.ground && p.vy < -6) p.squash = 1
      p.y = 0
      p.vy = 0
      p.ground = true
    } else {
      p.ground = false
    }
    p.walk = p.ground && Math.hypot(p.vx, p.vz) > 0.5 ? p.walk + dt : 0
  }

  function updateBugs(dt) {
    const p = player
    for (const b of bugs) {
      if (!b.alive) {
        b.dead += dt
        if (b.dead > BUG_RESPAWN * (b.big ? 2.5 : 1)) {
          Object.assign(b, { alive: true, hp: b.big ? 3 : 1, x: b.from, squash: 0 })
          b.group.visible = b.shadow.visible = true
        }
        continue
      }
      b.x += b.vx * dt
      if (b.x < b.from || b.x > b.to) {
        b.x = Math.max(b.from, Math.min(b.to, b.x))
        b.vx = -b.vx
      }
      b.zNow = b.z + Math.sin(state.time * 1.3 + b.phase) * 0.7
      if (b.flash > 0) b.flash -= dt

      const dist = Math.hypot(p.x - b.x, p.z - b.zNow)
      if (dist > b.radius + 0.35 || p.y > b.height + 0.3) continue
      const stomp = p.vy < 0 && p.y > b.height * 0.3
      if (stomp) {
        p.vy = 8
        b.hp--
        b.flash = 0.25
        if (b.hp <= 0) {
          b.alive = false
          b.dead = 0
          state.bugsFixed++
          sfx.stomp()
          burst(b.x, 0.4, b.zNow, b.big ? [PAL.red, PAL.orange, PAL.yellow] : [PAL.purple, PAL.lime, PAL.white], b.big ? 18 : 10)
          floatText('FIXED!', b.x, b.height + 1, b.zNow, PAL.lime)
          callbacks.onBug?.(state.bugsFixed, b.big)
        } else {
          sfx.bossHit()
        }
      } else if (p.hurt <= 0) {
        p.hurt = 1
        const away = Math.sign(p.x - b.x) || 1
        p.vx = away * 7
        p.vy = 6
        p.ground = false
        sfx.hurt()
        floatText('OUCH', p.x, PLAYER_H + 0.8, p.z, PAL.orange)
      }
    }
  }

  // Objects stand further back than the player, so compare where they
  // appear on screen (perspective), not their raw x
  function findNear() {
    const cx = camera.position.x
    const cz = camera.position.z
    let near = null
    let best = Infinity
    for (const o of objects) {
      const k = (cz - player.z) / (cz - o.z)
      const d = Math.abs(player.x - (cx + (o.x - cx) * k))
      if (d < (o.reach + 0.3) * k && d < best) {
        best = d
        near = o
      }
    }
    if (near !== state.near) {
      state.near = near
      callbacks.onNear?.(near?.panel ?? null)
    }
  }

  function updateGoal() {
    if (state.reachedGoal || Math.abs(player.x - pole.x) > 0.5) return
    state.reachedGoal = true
    sfx.powerUp()
    for (let i = 0; i < 6; i++)
      burst(pole.x - 3 + i * 1.6, 5 + art.rand(i) * 2, pole.z - 2, [PAL.yellow, PAL.cyan, PAL.lime, PAL.red], 14, 6)
    callbacks.onGoal?.()
  }

  function update(dt) {
    state.time += dt
    state.blink -= dt
    if (state.blink < -4) state.blink = 0.15
    if (state.pending) {
      state.pending.t -= dt
      if (state.pending.t <= 0) {
        open(state.pending.o)
        state.pending = null
      }
    }
    if (state.paused) return
    updatePlayer(dt)
    updateBugs(dt)
    findNear()
    updateGoal()
    if (input.interact) {
      input.interact = false
      interact()
    }
  }

  /* ---------- Animation of everything (runs even while paused) ---------- */
  function turn(current, face, dt) {
    const target = face > 0 ? 0 : Math.PI
    const step = 16 * dt
    return Math.abs(target - current) <= step ? target : current + Math.sign(target - current) * step
  }

  function animate(dt) {
    const p = player
    // Paper flip when turning around + a little waddle when walking
    p.angle = turn(p.angle, p.face, dt)
    p.squash = Math.max(0, p.squash - dt * 5)
    p.group.position.set(p.x, p.y + (p.walk ? Math.abs(Math.sin(p.walk * 12)) * 0.12 : 0), p.z)
    p.mesh.rotation.set(0, p.angle, p.walk ? Math.sin(p.walk * 12) * 0.07 : 0)
    p.mesh.scale.set(1 + p.squash * 0.2, 1 - p.squash * 0.2, 1)
    p.mesh.material.map = playerArt[state.blink > 0 ? 1 : 0].tex
    p.mesh.visible = p.hurt <= 0 || Math.floor(p.hurt * 12) % 2 === 0
    p.shadow.position.set(p.x, 0.02, p.z)
    p.shadow.scale.setScalar(Math.max(0.4, 0.9 - p.y * 0.12))

    for (const b of bugs) {
      if (!b.alive) {
        // squashed flat like a sheet of paper, then gone
        b.squash = Math.min(1, b.squash + dt * 5)
        b.mesh.scale.y = (b.big ? 2.6 : 1.4) * (1 - b.squash * 0.9)
        if (b.squash >= 1) b.group.visible = b.shadow.visible = false
        continue
      }
      b.angle = turn(b.angle, b.vx, dt)
      b.group.position.set(b.x, Math.abs(Math.sin(state.time * 8 + b.phase)) * 0.08, b.zNow)
      b.mesh.rotation.y = b.angle
      b.mesh.material = bugMats[b.big ? 1 : 0][Math.floor(state.time * 5 + b.phase) % 2]
      b.mesh.visible = b.flash <= 0 || Math.floor(b.flash * 20) % 2 === 0
      b.mesh.scale.y = b.big ? 2.6 : 1.4
      b.shadow.position.set(b.x, 0.02, b.zNow)
    }

    for (const b of blocks) {
      b.bump = Math.max(0, b.bump - dt * 6)
      b.mesh.position.y = BLOCK_Y + 0.5 + Math.sin(b.bump * Math.PI) * 0.25
    }

    // Cut-outs unfold from the ground as the player approaches
    for (const o of [...objects, ...deco]) {
      if (o.pop < 1 && o.pivot.position.x < p.x + POP_AHEAD) o.pop = Math.min(1, o.pop + dt * 2.2)
      o.pivot.rotation.x = -(Math.PI / 2) * (1 - easeBack(o.pop))
    }

    for (const o of objects) {
      if (o.facade) {
        const step = dt * 3.5
        o.openT = o.openT < o.openTarget ? Math.min(o.openTarget, o.openT + step) : Math.max(o.openTarget, o.openT - step)
        o.facade.rotation.y = FACADE_OPEN * ease(o.openT)
      }
      if (o.cloth) {
        const raised = o.type === 'pole' ? state.reachedGoal : o.visited
        if (raised) o.raise = Math.min(1, o.raise + dt * 1.2)
        const top = o.type === 'pole' ? 5.4 : 2.9
        o.cloth.position.y = 0.5 + (top - 0.5) * ease(o.raise)
        o.cloth.rotation.y = Math.sin(state.time * 3 + o.x) * 0.25
      }
      if (o.type === 'terminal') o.mesh.material.map = o.screens[Math.floor(state.time * 2) % 2].tex
      if (o.type === 'cabinet') {
        o.hop = Math.max(0, (o.hop ?? 0) - dt)
        o.mesh.position.y = Math.sin((o.hop / 0.35) * Math.PI) * 0.3
      }
    }

    waterTex.offset.x = (state.time * 0.08) % 1
    for (const c of cloudList) c.mesh.position.x = c.home + ((state.time * c.speed) % 40) - 20

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i]
      s.t += dt
      s.m.position.y = BLOCK_Y + 1 + ease(Math.min(1, s.t * 2)) * 1.2
      s.m.rotation.y = s.t * 14
      if (s.t > 0.9) {
        scene.remove(s.m)
        stars.splice(i, 1)
      }
    }

    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]
      b.t += dt
      b.vy -= GRAVITY * 0.5 * dt
      b.m.position.x += b.vx * dt
      b.m.position.y += b.vy * dt
      b.m.position.z += b.vz * dt
      b.m.rotation.set(b.t * b.spin, b.t * b.spin * 0.7, 0)
      if (b.t > 1.4 || b.m.position.y < 0) {
        scene.remove(b.m)
        bits.splice(i, 1)
      }
    }
  }

  const camBack = () => (state.portrait ? 19 : 16.5)

  function updateCamera(dt, snap = false) {
    const p = player
    const k = snap ? 1 : Math.min(1, dt * 4)
    const tx = Math.max(0, Math.min(end - 4, p.x + p.face * CAM_LEAD))
    state.cam.x += (tx - state.cam.x) * k
    state.cam.z += (p.z * 0.45 - state.cam.z) * k
    state.cam.y += (Math.max(0, p.y - 1) * 0.4 - state.cam.y) * k
    camera.position.set(state.cam.x, 4.6 + state.cam.y, camBack() + state.cam.z)
    camera.lookAt(state.cam.x, 1.7 + state.cam.y, state.cam.z - 1.5)
    sun.position.set(state.cam.x - 6, 14, state.cam.z + 10)
    sun.target.position.set(state.cam.x, 0, state.cam.z - 1)
  }

  /* ---------- DOM overlay (prompt, sign bubble, floating text) ---------- */
  const v = new THREE.Vector3()
  function toScreen(x, y, z) {
    v.set(x, y, z).project(camera)
    return [((v.x + 1) / 2) * state.viewW, ((1 - v.y) / 2) * state.viewH]
  }

  function updateOverlay(dt) {
    const o = state.paused ? null : state.near
    const showPrompt = o?.panel && !state.pending
    prompt.hidden = !showPrompt
    if (showPrompt) {
      const [sx, sy] = toScreen(player.x, player.y + PLAYER_H + 0.35, player.z)
      prompt.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`
      const key = callbacks.touch?.() ? 'B' : 'E'
      const text = `${key}|${o.label ?? 'Open'}`
      if (prompt.dataset.text !== text) {
        prompt.dataset.text = text
        prompt.innerHTML = ''
        const k = document.createElement('kbd')
        k.textContent = key
        prompt.append(k, ` ${o.label ?? 'Open'}`)
      }
    }

    const sign = o?.type === 'sign' ? o : null
    bubble.hidden = !sign
    if (sign) {
      const [sx, sy] = toScreen(sign.x, 2.1, sign.z)
      bubble.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`
      if (bubble.dataset.sign !== sign.title) {
        bubble.dataset.sign = sign.title
        bubble.innerHTML = ''
        for (const line of sign.lines) {
          const p = document.createElement('p')
          p.textContent = line
          bubble.append(p)
        }
      }
    }

    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]
      f.t += dt
      const [sx, sy] = toScreen(f.x, f.y + f.t * 0.8, f.z)
      f.el.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -50%)`
      f.el.style.opacity = f.t > 1 ? String(Math.max(0, 1.4 - f.t) / 0.4) : '1'
      if (f.t > 1.4) {
        f.el.remove()
        floaters.splice(i, 1)
      }
    }
  }

  /* ---------- Loop ---------- */
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    update(dt)
    animate(dt)
    updateCamera(dt)
    renderer.render(scene, camera)
    updateOverlay(dt)
    raf = requestAnimationFrame(frame)
  }

  resize()
  updateCamera(0, true)
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
        Object.assign(input, { left: false, right: false, up: false, down: false, jump: false, interact: false })
      } else {
        // windows closed: buildings fold their fronts back
        for (const o of objects) o.openTarget = 0
      }
    },
    // Moves the player in front of a zone or object (quick menu)
    warp(panel) {
      const [zone, index] = panel.split(':')
      const target =
        objects.find((o) => o.panel === panel && o.type !== 'sign' && o.type !== 'pole') ??
        (zone === 'games' ? objects.find((o) => o.panel === 'game:0') : null) ??
        (index == null && layout.zoneX[zone] != null ? { x: layout.zoneX[zone] } : null)
      if (!target) return
      // stand where the object appears right behind the player on screen
      const camZ = camBack() + 1.2 * 0.45
      const k = (camZ - 1.2) / (camZ - (target.z ?? 1.2))
      const x = target.x + CAM_LEAD * (1 / k - 1)
      Object.assign(player, { x, z: 1.2, y: 0, vx: 0, vy: 0, vz: 0, face: 1, angle: 0, hurt: 0 })
      state.pending = null
      for (const o of [...objects, ...deco]) if (Math.abs(o.pivot.position.x - player.x) < POP_AHEAD) o.pop = 1
      if (target.facade) target.openTarget = 1
      updateCamera(0, true)
      findNear()
    },
    progress() {
      return Math.max(0, Math.min(1, player.x / end))
    },
    zones() {
      return Object.entries(layout.zoneX).map(([id, x]) => ({ id, at: x / end }))
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      prompt.remove()
      bubble.remove()
      floaters.forEach((f) => f.el.remove())
      new Set(trash).forEach((t) => t.dispose?.())
      renderer.dispose()
    },
  }
}
