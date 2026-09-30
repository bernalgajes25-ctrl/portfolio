import * as THREE from 'three'
import { BEETLE, INVADER, drawSprite } from '../../sprites.js'
import { AVATAR_COLORS, avatarRows } from '../shared.jsx'
import { PAL } from '../game/level.js'

// ------------------------------------------------------------
//  Pixel art for the paper world. Everything is drawn by code on
//  small canvases (1 canvas pixel = 1 texel) and turned into
//  textures with nearest filtering, so it stays crisp in 3D.
// ------------------------------------------------------------

export const TEXELS = 16 // texels per world unit
const PAPER = '#fbf6e9' // the white border around every cut-out

const WOOD = '#9a5b3c'
const WOOD_DARK = '#6b3a28'

/* ---------- Tiny 3x5 pixel font (no font loading needed) ---------- */
// Each glyph is 5 rows of 3 pixels, separated by spaces
const FONT = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###', 0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###',
  2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.', 4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.',
  6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.', 8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.',
  '-': '... ... ### ... ...', '&': '.#. #.# .#. #.# .##', '?': '##. ..# .#. ... .#.', '!': '.#. .#. .#. ... .#.',
  '.': '... ... ... ... .#.', '>': '#.. .#. ..# .#. #..', '<': '..# .#. #.. .#. ..#', ':': '... .#. ... .#. ...',
  '/': '..# ..# .#. #.. #..', '_': '... ... ... ... ###', ' ': '... ... ... ... ...',
}
const GLYPHS = Object.fromEntries(Object.entries(FONT).map(([k, v]) => [k, v.replaceAll(' ', '')]))

export function textWidth(text) {
  return text.length * 4 - 1
}

export function pixelText(ctx, text, x, y, color) {
  ctx.fillStyle = color
  ;[...text.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS['?']
    for (let p = 0; p < 15; p++) if (g[p] === '#') ctx.fillRect(x + i * 4 + (p % 3), y + Math.floor(p / 3), 1, 1)
  })
}

/* ---------- Canvas + texture helpers ---------- */
function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function toTexture(c, repeat = false) {
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.generateMipmaps = false
  t.colorSpace = THREE.SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const rect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}
const box = (ctx, x, y, w, h, fill, line = PAL.ink) => {
  rect(ctx, x, y, w, h, line)
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill)
}

// Deterministic pseudo-random number in [0, 1)
export function rand(i, k = 0) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Adds the white "cut-out" border around the opaque pixels
function paperBorder(c) {
  const ctx = c.getContext('2d')
  const { width: w, height: h } = c
  const img = ctx.getImageData(0, 0, w, h)
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3])
  const edge = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (a(x, y) < 128 && (a(x - 1, y) > 127 || a(x + 1, y) > 127 || a(x, y - 1) > 127 || a(x, y + 1) > 127))
        edge.push([x, y])
  ctx.fillStyle = PAPER
  edge.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1))
}

/**
 * A paper cut-out: draws `draw(ctx)` on a (w+2)x(h+2) canvas (1px margin
 * for the white border). Returns the canvas, its texture and a redraw().
 */
export function cutout(w, h, draw) {
  const c = canvas(w + 2, h + 2)
  const ctx = c.getContext('2d')
  const tex = toTexture(c)
  const redraw = (...args) => {
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.save()
    ctx.translate(1, 1)
    draw(ctx, ...args)
    ctx.restore()
    paperBorder(c)
    tex.needsUpdate = true
  }
  redraw()
  return { canvas: c, tex, redraw, w: c.width / TEXELS, h: c.height / TEXELS }
}

/* ---------- Characters ---------- */
// Two cut-outs (eyes open / closed) of the portfolio avatar
export function avatarArt(blink) {
  return cutout(16, 20, (ctx) =>
    avatarRows(blink).forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== '.') rect(ctx, x, y, 1, 1, AVATAR_COLORS[ch])
      }),
    ),
  )
}

export function bugArt(big) {
  const frames = big ? INVADER : BEETLE
  return frames.map((f) =>
    cutout(11, 8, (ctx) => {
      drawSprite(ctx, f, 0, 0, big ? PAL.red : PAL.purple)
      // eyes so the bug reads as a character, not a blob
      rect(ctx, 4, 3, 1, 1, big ? PAL.white : PAL.lime)
      rect(ctx, 6, 3, 1, 1, big ? PAL.white : PAL.lime)
    }),
  )
}

export function starArt() {
  return cutout(11, 11, (ctx) => {
    const rows = ['     #     ', '    ###    ', '    ###    ', '###########', ' ######### ', '  #######  ', '  #######  ', ' ####.#### ', ' ###   ### ', '##       ##', '#         #']
    rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && rect(ctx, x, y, 1, 1, PAL.yellow)))
    rect(ctx, 4, 4, 1, 2, PAL.ink)
    rect(ctx, 6, 4, 1, 2, PAL.ink)
  })
}

/* ---------- Buildings (facade + interior share the silhouette) ---------- */
function roof(ctx, cx, top, rows, halfStart, step, color, stripe) {
  for (let r = 0; r < rows; r++) {
    const half = Math.round(halfStart + r * step)
    rect(ctx, cx - half, top + r, half * 2, 1, r % 4 === 3 ? stripe : color)
  }
}

function sign(ctx, x, y, text, fill = PAL.white, ink = PAL.ink) {
  const w = textWidth(text) + 6
  box(ctx, x - Math.floor(w / 2), y, w, 9, fill)
  pixelText(ctx, text, x - Math.floor(w / 2) + 3, y + 2, ink)
}

function room(ctx, x, y, w, h) {
  rect(ctx, x, y, w, h, '#3a2f4f')
  for (let i = x + 2; i < x + w; i += 6) rect(ctx, i, y, 1, h - 8, '#453a5e')
  rect(ctx, x, y + h - 8, w, 8, WOOD_DARK)
  for (let i = x; i < x + w; i += 5) rect(ctx, i, y + h - 8, 1, 8, WOOD)
}

export function houseArt(inside) {
  return cutout(80, 72, (ctx) => {
    rect(ctx, 56, 2, 8, 14, PAL.dark)
    rect(ctx, 55, 0, 10, 3, PAL.gray)
    roof(ctx, 40, 2, 24, 10, 1.25, PAL.red, PAL.purple)
    if (inside) {
      room(ctx, 8, 26, 64, 46)
      // framed portrait of the avatar
      box(ctx, 14, 32, 20, 22, PAL.yellow)
      avatarRows().forEach((row, y) =>
        [...row].forEach((ch, x) => ch !== '.' && rect(ctx, 16 + x, 33 + y, 1, 1, AVATAR_COLORS[ch])),
      )
      // bed
      box(ctx, 42, 54, 26, 10, PAL.white)
      rect(ctx, 50, 55, 17, 8, PAL.blue)
      rect(ctx, 42, 64, 2, 4, WOOD_DARK)
      rect(ctx, 66, 64, 2, 4, WOOD_DARK)
    } else {
      box(ctx, 8, 26, 64, 46, PAL.yellow)
      for (let y = 30; y < 70; y += 5) rect(ctx, 9, y, 62, 1, '#f0b860')
      box(ctx, 32, 46, 16, 26, PAL.purple)
      rect(ctx, 44, 58, 2, 2, PAL.yellow)
      for (const wx of [14, 54]) {
        box(ctx, wx, 34, 12, 12, PAL.cyan)
        rect(ctx, wx + 5, 35, 1, 10, PAL.ink)
        rect(ctx, wx + 1, 40, 10, 1, PAL.ink)
      }
    }
    sign(ctx, 40, 14, 'PROFILE')
  })
}

export function workshopArt(inside) {
  return cutout(72, 56, (ctx) => {
    rect(ctx, 2, 6, 68, 8, PAL.teal)
    for (let x = 2; x < 70; x += 8) rect(ctx, x, 6, 4, 8, PAL.lime)
    rect(ctx, 0, 13, 72, 2, PAL.ink)
    if (inside) {
      room(ctx, 4, 15, 64, 41)
      // desk with a laptop and a spinning-cube render on the wall
      rect(ctx, 10, 40, 30, 3, WOOD)
      rect(ctx, 12, 43, 2, 5, WOOD_DARK)
      rect(ctx, 36, 43, 2, 5, WOOD_DARK)
      box(ctx, 16, 30, 16, 10, PAL.dark)
      rect(ctx, 18, 32, 12, 6, PAL.cyan)
      pixelText(ctx, '</>', 19, 32, PAL.ink)
      box(ctx, 46, 20, 18, 18, PAL.white)
      rect(ctx, 50, 26, 8, 8, PAL.orange)
      rect(ctx, 52, 24, 8, 2, PAL.yellow)
      rect(ctx, 58, 24, 2, 8, PAL.red)
    } else {
      box(ctx, 4, 15, 64, 41, PAL.light)
      for (let y = 18; y < 55; y += 4) rect(ctx, 5, y, 62, 1, '#a8c0d0')
      box(ctx, 22, 28, 28, 28, PAL.gray)
      for (let y = 31; y < 56; y += 3) rect(ctx, 23, y, 26, 1, PAL.dark)
      // gear
      rect(ctx, 9, 24, 8, 8, PAL.yellow)
      rect(ctx, 12, 22, 2, 12, PAL.yellow)
      rect(ctx, 7, 27, 12, 2, PAL.yellow)
      rect(ctx, 12, 27, 2, 2, PAL.ink)
    }
    sign(ctx, 36, 17, 'DEV & 3D')
  })
}

export function castleArt(inside) {
  return cutout(104, 88, (ctx) => {
    const stone = (x, y, w, h) => {
      box(ctx, x, y, w, h, PAL.light)
      for (let yy = y + 4; yy < y + h - 1; yy += 5)
        for (let xx = x + ((yy / 5) % 2 ? 2 : 6); xx < x + w - 2; xx += 9) rect(ctx, xx, yy, 5, 1, PAL.gray)
    }
    const tower = (x) => {
      stone(x, 14, 24, 74)
      for (let i = 0; i < 4; i++) box(ctx, x + i * 6, 8, 6, 7, PAL.light)
      box(ctx, x + 9, 26, 6, 10, PAL.ink)
    }
    stone(18, 30, 68, 58)
    for (let i = 0; i < 11; i++) box(ctx, 18 + Math.round(i * 6.2), 24, 6, 7, PAL.light)
    tower(0)
    tower(80)
    // flags on the towers
    rect(ctx, 11, 0, 1, 9, PAL.ink)
    rect(ctx, 12, 0, 7, 4, PAL.red)
    rect(ctx, 91, 0, 1, 9, PAL.ink)
    rect(ctx, 92, 0, 7, 4, PAL.cyan)
    if (inside) {
      rect(ctx, 34, 52, 36, 36, '#3a2f4f')
      // treasure chest full of letters
      box(ctx, 40, 70, 24, 14, WOOD)
      rect(ctx, 41, 76, 22, 1, PAL.yellow)
      box(ctx, 44, 62, 10, 8, PAL.white)
      rect(ctx, 45, 63, 4, 3, PAL.red)
      box(ctx, 52, 60, 10, 8, PAL.white)
    } else {
      box(ctx, 34, 52, 36, 36, WOOD_DARK)
      rect(ctx, 34, 52, 36, 2, PAL.ink)
      for (let x = 38; x < 70; x += 6) rect(ctx, x, 54, 1, 34, WOOD)
    }
    sign(ctx, 52, 38, 'CONTACT', PAL.yellow)
  })
}

/* ---------- Props ---------- */
export function terminalArt(on) {
  return cutout(44, 46, (ctx) => {
    box(ctx, 4, 2, 36, 28, PAL.light)
    box(ctx, 7, 5, 30, 20, PAL.night)
    pixelText(ctx, '> BUG', 10, 8, PAL.red)
    pixelText(ctx, 'FOUND', 10, 15, on ? PAL.lime : PAL.night)
    rect(ctx, 30, 15, 3, 5, on ? PAL.lime : PAL.night)
    rect(ctx, 16, 30, 12, 4, PAL.gray)
    rect(ctx, 0, 34, 44, 4, WOOD)
    rect(ctx, 0, 37, 44, 1, WOOD_DARK)
    rect(ctx, 3, 38, 3, 8, WOOD_DARK)
    rect(ctx, 38, 38, 3, 8, WOOD_DARK)
  })
}

const CABINET_COLORS = [PAL.red, PAL.blue, PAL.purple, PAL.teal]

export function cabinetArt(index, cover) {
  return cutout(24, 44, (ctx) => {
    const body = CABINET_COLORS[index % 4]
    box(ctx, 0, 4, 24, 40, body)
    box(ctx, 1, 0, 22, 8, PAL.yellow)
    pixelText(ctx, String(index + 1).padStart(2, '0'), 8, 2, PAL.ink)
    box(ctx, 3, 10, 18, 14, PAL.ink)
    if (cover?.complete && cover.naturalWidth) {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(cover, 4, 11, 16, 12)
    } else {
      rect(ctx, 4, 11, 16, 12, PAL.navy)
      pixelText(ctx, '?', 11, 15, PAL.cyan)
    }
    box(ctx, 1, 25, 22, 6, PAL.dark)
    rect(ctx, 5, 26, 2, 3, PAL.ink)
    rect(ctx, 4, 26, 4, 1, PAL.red)
    rect(ctx, 13, 27, 2, 2, PAL.yellow)
    rect(ctx, 17, 27, 2, 2, PAL.cyan)
    rect(ctx, 10, 35, 4, 5, PAL.ink)
    rect(ctx, 11, 36, 2, 1, PAL.orange)
  })
}

export function poleArt(height) {
  return cutout(6, height, (ctx) => {
    box(ctx, 0, 0, 6, 6, PAL.yellow)
    rect(ctx, 2, 6, 2, height - 12, PAL.white)
    rect(ctx, 3, 6, 1, height - 12, PAL.light)
    box(ctx, 0, height - 6, 6, 6, PAL.gray)
  })
}

export function flagArt(text, kind) {
  const fill = { work: PAL.cyan, study: PAL.yellow, locked: PAL.gray, goal: PAL.lime }[kind]
  return cutout(22, 14, (ctx) => {
    box(ctx, 0, 0, 22, 14, fill)
    rect(ctx, 1, 11, 20, 2, 'rgba(13,14,24,0.18)')
    pixelText(ctx, text, 11 - Math.floor(textWidth(text) / 2), 4, PAL.ink)
  })
}

export function signArt(title) {
  const w = Math.max(28, textWidth(title) + 8)
  return cutout(w, 26, (ctx) => {
    rect(ctx, w / 2 - 2, 12, 4, 14, WOOD_DARK)
    box(ctx, 0, 0, w, 14, WOOD)
    rect(ctx, 1, 10, w - 2, 2, WOOD_DARK)
    pixelText(ctx, title, 4, 4, PAL.white)
  })
}

export function treeArt(variant) {
  const green = variant % 2 ? PAL.green : PAL.teal
  return cutout(34, 50, (ctx) => {
    rect(ctx, 14, 30, 6, 20, WOOD)
    rect(ctx, 14, 30, 2, 20, WOOD_DARK)
    const blobs = [
      [17, 16, 14],
      [9, 24, 9],
      [25, 24, 9],
    ]
    for (const [cx, cy, r] of blobs)
      for (let y = -r; y <= r; y++) {
        const half = Math.round(Math.sqrt(r * r - y * y))
        rect(ctx, cx - half, cy + y, half * 2, 1, y > r / 3 ? PAL.teal : green)
      }
    for (let i = 0; i < 9; i++) rect(ctx, 6 + Math.floor(rand(variant, i) * 22), 6 + Math.floor(rand(i, variant) * 22), 2, 1, PAL.lime)
  })
}

export function bushArt(variant) {
  return cutout(26, 12, (ctx) => {
    for (const [cx, r] of [
      [6, 6],
      [13, 8],
      [20, 6],
    ])
      for (let y = -r; y <= 0; y++) {
        const half = Math.round(Math.sqrt(r * r - y * y))
        rect(ctx, cx - half, 11 + y, half * 2, 1, y < -r / 2 ? PAL.lime : PAL.green)
      }
    if (variant % 3 === 0) {
      rect(ctx, 8, 5, 2, 2, PAL.red)
      rect(ctx, 17, 6, 2, 2, PAL.yellow)
    }
  })
}

export function flowerArt(variant) {
  const color = [PAL.red, PAL.yellow, PAL.cyan, PAL.orange][variant % 4]
  return cutout(5, 8, (ctx) => {
    rect(ctx, 2, 3, 1, 5, PAL.green)
    rect(ctx, 1, 0, 3, 3, color)
    rect(ctx, 2, 1, 1, 1, PAL.yellow)
    rect(ctx, 3, 5, 1, 1, PAL.lime)
  })
}

export function cloudArt(variant) {
  const w = 40 + (variant % 3) * 10
  return cutout(w, 16, (ctx) => {
    rect(ctx, 4, 8, w - 8, 8, PAL.white)
    rect(ctx, 10, 3, w / 2 - 6, 6, PAL.white)
    rect(ctx, w / 2, 0, Math.round(w / 3), 9, PAL.white)
    rect(ctx, 4, 14, w - 8, 2, PAL.light)
  })
}

export function hillArt(variant) {
  const w = 160
  const h = 56 + (variant % 3) * 12
  return cutout(w, h, (ctx) => {
    for (let y = 0; y < h; y++) {
      const t = y / h
      const half = Math.round((w / 2) * Math.sqrt(t) * 0.98)
      rect(ctx, w / 2 - half, y, half * 2, 1, (Math.floor(y / 6) % 2 ? '#2f9e57' : PAL.green))
    }
    rect(ctx, w / 2 - 2, 10, 4, 3, PAL.lime)
    rect(ctx, w / 2 - 30, 30, 3, 2, PAL.lime)
    rect(ctx, w / 2 + 24, 38, 3, 2, PAL.lime)
  })
}

/* ---------- Tiled textures (blocks and ground) ---------- */
export function blockTexture(used) {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  box(ctx, 0, 0, 16, 16, used ? PAL.gray : PAL.yellow)
  rect(ctx, 1, 1, 14, 1, used ? PAL.light : PAL.white)
  rect(ctx, 1, 14, 14, 1, used ? PAL.dark : PAL.orange)
  for (const [x, y] of [
    [2, 2],
    [13, 2],
    [2, 13],
    [13, 13],
  ])
    rect(ctx, x, y, 1, 1, PAL.ink)
  if (!used) {
    const q = ['.###.', '#...#', '...#.', '..#..', '.....', '..#..']
    q.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && rect(ctx, 6 + x, 4 + y, 1, 1, PAL.orange)))
    q.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && rect(ctx, 5 + x, 4 + y, 1, 1, PAL.ink)))
  }
  return toTexture(c)
}

export function grassTexture() {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  rect(ctx, 0, 0, 16, 16, PAL.green)
  for (let i = 0; i < 18; i++) rect(ctx, Math.floor(rand(i, 1) * 16), Math.floor(rand(i, 2) * 16), 1, 2, i % 3 ? '#2f9e57' : PAL.lime)
  return toTexture(c, true)
}

export function pathTexture() {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  rect(ctx, 0, 0, 16, 16, '#e8b877')
  for (let i = 0; i < 14; i++) rect(ctx, Math.floor(rand(i, 3) * 16), Math.floor(rand(i, 4) * 16), 2, 1, i % 2 ? '#d49a5e' : PAL.yellow)
  return toTexture(c, true)
}

export function dirtTexture() {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  rect(ctx, 0, 0, 16, 16, WOOD)
  rect(ctx, 0, 0, 16, 3, PAL.green)
  rect(ctx, 0, 3, 16, 1, '#2f9e57')
  for (let i = 0; i < 10; i++) rect(ctx, Math.floor(rand(i, 5) * 16), 5 + Math.floor(rand(i, 6) * 11), 2, 1, WOOD_DARK)
  return toTexture(c, true)
}

export function skyTexture() {
  const c = canvas(2, 64)
  const ctx = c.getContext('2d')
  const bands = ['#3b8fe8', PAL.sky, PAL.sky, PAL.sky, '#5cc0f8', '#66d6f7']
  bands.forEach((color, i) => rect(ctx, 0, Math.floor((i * 64) / bands.length), 2, Math.ceil(64 / bands.length), color))
  return toTexture(c)
}

export function waterTexture() {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  rect(ctx, 0, 0, 16, 16, PAL.blue)
  for (let i = 0; i < 6; i++) rect(ctx, Math.floor(rand(i, 20) * 12), Math.floor(rand(i, 21) * 16), 4, 1, i % 2 ? PAL.sky : PAL.cyan)
  return toTexture(c, true)
}

export function shadowTexture() {
  const c = canvas(16, 16)
  const ctx = c.getContext('2d')
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 56) rect(ctx, x, y, 1, 1, 'rgba(13,14,24,1)')
  return toTexture(c)
}
