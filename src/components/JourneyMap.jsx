import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { avatar } from '../data/portfolio.js'
import { sfx } from '../sound.js'

// Super Mario World style overworld map for the "My journey" section.
// Drawn as an SVG in a small logical resolution (320x120) that CSS
// scales up, so every unit is a chunky pixel.

const W = 320
const H = 120
const WATER_Y = 106
const WALK_SPEED = 70 // map pixels per second

const C = {
  outline: '#0d0e18',
  grass: '#38b764',
  grassLight: '#a7f070',
  grassDark: '#257179',
  path: '#ffcd75',
  pathDot: '#ef7d57',
  water: '#3b5dc9',
  waterLight: '#73eff7',
  white: '#f4f4f4',
  gray: '#94b0c2',
  grayDark: '#566c86',
  red: '#b13e53',
  blue: '#3b5dc9',
  trunk: '#5d275d',
  window: '#333c57',
}

// ---------- sprites: each char is one pixel, "." = transparent ----------
const TREE = ['..GGG..', '.GGgGG.', 'GGGGGgG', 'GgGGGGG', '.GGGgG.', '..GGG..', '...T...', '...T...']
const BUSH = ['.GGG.', 'GGgGG', 'GGGGG']
const FLOWER = ['.R.', 'RYR', '.R.']
const CASTLE = ['....RR...', '....O....', 'W.W.W.W.W', 'WWWWWWWWW', 'WWDWWWDWW', 'WWWWWWWWW', 'WWWDDDWWW', 'WWWDDDWWW']
const SCHOOL = ['....B....', '...BBB...', '..BBBBB..', '.BBBBBBB.', 'BBBBBBBBB', '.WWWWWWW.', '.WDWWWDW.', '.WWWDWWW.']
const PLAYER = [
  '..OOOO..',
  '.OHHHHO.',
  'OPHHHHPO',
  'OHSSSSHO',
  'OHESSEHO',
  'OHSSSSHO',
  '.OTTTTO.',
  'OTTTTTTO',
  '.OTTTTO.',
  '.OO..OO.',
]

const DECOR_COLORS = { G: C.grassDark, g: C.grassLight, T: C.trunk, R: C.red, Y: C.path }
const CASTLE_COLORS = { R: C.red, O: C.outline, W: C.white, D: C.window }
const LOCKED_COLORS = { R: C.grayDark, O: C.outline, W: C.gray, D: C.grayDark }
const SCHOOL_COLORS = { B: C.blue, W: C.white, D: C.window }

function Sprite({ rows, colors, x, y }) {
  return rows.flatMap((row, r) =>
    [...row].map((ch, c) =>
      colors[ch] ? <rect key={`${c}-${r}`} x={x + c} y={y + r} width="1" height="1" fill={colors[ch]} /> : null,
    ),
  )
}

// Small deterministic random generator, so decorations don't move on reload
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Node positions zig-zag across the map; the route between two nodes is an
// L-shaped path (horizontal, vertical, horizontal) like a classic overworld.
function buildLayout(count) {
  const nodes = Array.from({ length: count }, (_, i) => ({
    x: Math.round(34 + (i * (W - 68)) / Math.max(count - 1, 1)),
    y: i % 2 === 0 ? 76 : 46,
  }))
  const route = [nodes[0]]
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1]
    const b = nodes[i]
    const mid = Math.round((a.x + b.x) / 2)
    route.push({ x: mid, y: a.y }, { x: mid, y: b.y }, b)
  }
  // dots every 5 map pixels along the route
  const dots = []
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    for (let d = 0; d < len; d += 5) {
      dots.push({ x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len })
    }
  }
  return { nodes, route, dots }
}

function buildDecorations({ nodes, dots }) {
  const rand = seeded(7)
  const items = []
  const clear = (x, y, r) =>
    dots.every((d) => Math.hypot(d.x - x, d.y - y) > r) && nodes.every((n) => Math.hypot(n.x - x, n.y - y) > 22)

  for (let y = 26; y < WATER_Y - 10; y += 11) {
    for (let x = 4; x < W - 10; x += 12) {
      const jx = x + Math.floor(rand() * 6)
      const jy = y + Math.floor(rand() * 4)
      const roll = rand()
      if (!clear(jx + 3, jy + 4, 11)) continue
      if (roll < 0.28) items.push({ type: 'tree', x: jx, y: jy })
      else if (roll < 0.4) items.push({ type: 'bush', x: jx, y: jy + 4 })
      else if (roll < 0.5) items.push({ type: 'flower', x: jx, y: jy + 4 })
    }
  }
  return items
}

// Hill: a pixel mound `w` wide
function Hill({ x, w }) {
  const rows = []
  const h = Math.floor(w / 2.5)
  for (let r = 0; r < h; r++) {
    const inset = Math.max(0, Math.round(((h - r) * (h - r)) / h / 1.2))
    rows.push(
      <rect key={r} x={x + inset} y={22 - h + r} width={w - inset * 2} height="1" fill={r === 0 ? C.grassLight : C.grassDark} />,
    )
  }
  return rows
}

export default function JourneyMap({ steps, selected, onSelect }) {
  const count = steps.length + 1 // + locked "next level"
  const layout = useMemo(() => buildLayout(count), [count])
  const decorations = useMemo(() => buildDecorations(layout), [layout])

  const [pos, setPos] = useState(layout.nodes[selected])
  const [walking, setWalking] = useState(false)
  const [step, setStep] = useState(0) // walk animation frame
  const current = useRef(selected)
  const raf = useRef()

  const playerColors = { O: C.outline, H: avatar.hair, P: avatar.headset, S: avatar.skin, E: C.outline, T: avatar.shirt }

  const walkTo = useCallback(
    (target) => {
      if (target === current.current || target < 0 || target >= count) return
      cancelAnimationFrame(raf.current)
      const from = current.current
      // waypoints along the route between the two nodes (3 route points per node)
      let points = layout.route.slice(Math.min(from, target) * 3, Math.max(from, target) * 3 + 1)
      if (target < from) points = points.reverse()
      current.current = target

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setPos(layout.nodes[target])
        onSelect(target)
        return
      }

      setWalking(true)
      let seg = 1
      let p = { ...points[0] }
      let last = performance.now()
      let stepTimer = 0
      const tick = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        let move = WALK_SPEED * dt
        while (move > 0 && seg < points.length) {
          const t = points[seg]
          const dist = Math.hypot(t.x - p.x, t.y - p.y)
          if (dist <= move) {
            p = { ...t }
            move -= dist
            seg++
          } else {
            p = { x: p.x + ((t.x - p.x) / dist) * move, y: p.y + ((t.y - p.y) / dist) * move }
            move = 0
          }
        }
        stepTimer += dt
        if (stepTimer > 0.12) {
          stepTimer = 0
          setStep((s) => s ^ 1)
        }
        setPos(p)
        if (seg < points.length) {
          raf.current = requestAnimationFrame(tick)
        } else {
          setWalking(false)
          sfx.select()
          onSelect(target)
        }
      }
      raf.current = requestAnimationFrame(tick)
    },
    [count, layout, onSelect],
  )

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      walkTo(current.current + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      walkTo(current.current - 1)
    }
  }

  // Everything that never changes is built once
  const scenery = useMemo(
    () => (
      <g>
        <defs>
          <pattern id="jm-grass" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={C.grass} />
            <rect x="1" y="1" width="1" height="1" fill={C.grassLight} />
            <rect x="4" y="4" width="1" height="1" fill={C.grassDark} />
          </pattern>
          <pattern id="jm-water" width="10" height="6" patternUnits="userSpaceOnUse">
            <rect width="10" height="6" fill={C.water} />
            <rect x="1" y="2" width="3" height="1" fill={C.waterLight} />
            <rect x="6" y="4" width="2" height="1" fill={C.waterLight} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#jm-grass)" />
        <Hill x={112} w={30} />
        <Hill x={150} w={20} />
        <Hill x={236} w={34} />
        <rect y={WATER_Y - 2} width={W} height="2" fill={C.path} />
        <rect y={WATER_Y} width={W} height={H - WATER_Y} fill="url(#jm-water)" />

        {/* route: dark border, sand path, then dots */}
        <polyline
          points={layout.route.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={C.outline}
          strokeWidth="9"
          strokeLinejoin="miter"
        />
        <polyline
          points={layout.route.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={C.path}
          strokeWidth="6"
          strokeLinejoin="miter"
        />
        {layout.dots.map((d, i) => (
          <rect key={i} x={Math.round(d.x) - 1} y={Math.round(d.y) - 1} width="2" height="2" fill={C.pathDot} />
        ))}

        {decorations.map((d, i) => (
          <g key={i}>
            <Sprite
              rows={d.type === 'tree' ? TREE : d.type === 'bush' ? BUSH : FLOWER}
              colors={DECOR_COLORS}
              x={d.x}
              y={d.y}
            />
          </g>
        ))}
      </g>
    ),
    [layout, decorations],
  )

  const bannerIndex = selected
  const bannerStep = steps[bannerIndex]

  return (
    <div className="world-map">
      <div className="world-map__banner" aria-live="polite">
        {bannerStep ? (
          <>
            <span className="world-map__level">WORLD {bannerStep.level}</span>
            <span>
              {bannerStep.title} · {bannerStep.place}
            </span>
          </>
        ) : (
          <>
            <span className="world-map__level">WORLD ?-?</span>
            <span>Next level: locked</span>
          </>
        )}
      </div>
      <div className="world-map__scroll">
        <svg
          className="world-map__svg"
          viewBox={`0 0 ${W} ${H}`}
          shapeRendering="crispEdges"
          tabIndex={0}
          role="group"
          aria-label="Journey map. Use the arrow keys or click a level to walk there."
          onKeyDown={onKeyDown}
        >
          {scenery}

          {layout.nodes.map((n, i) => {
            const locked = i === steps.length
            const s = steps[i]
            const isCurrent = s?.current
            return (
              <g
                key={i}
                className={`world-map__node ${i === selected ? 'is-selected' : ''}`}
                onClick={() => walkTo(i)}
                role="button"
                aria-label={locked ? 'Locked level' : `Level ${s.level}: ${s.title}`}
              >
                {/* building next to the node */}
                <Sprite
                  rows={locked || s.type === 'work' ? CASTLE : SCHOOL}
                  colors={locked ? LOCKED_COLORS : s.type === 'work' ? CASTLE_COLORS : SCHOOL_COLORS}
                  x={n.x + 5}
                  y={n.y - 17}
                />
                {/* level tile */}
                <rect x={n.x - 5} y={n.y - 4} width="10" height="8" fill={C.outline} />
                <rect
                  x={n.x - 4}
                  y={n.y - 3}
                  width="8"
                  height="6"
                  fill={locked ? C.grayDark : isCurrent ? C.red : C.path}
                  className={isCurrent ? 'world-map__pulse' : undefined}
                />
                <text x={n.x} y={n.y + 12} textAnchor="middle" className="world-map__label">
                  {locked ? '?-?' : s.level}
                </text>
                {/* bigger invisible hit area for easier clicking */}
                <rect x={n.x - 12} y={n.y - 20} width="30" height="36" fill="transparent" />
              </g>
            )
          })}

          {/* player */}
          <g transform={`translate(${Math.round(pos.x) - 4}, ${Math.round(pos.y) - 12 - (walking && step ? 1 : 0)})`}>
            <Sprite rows={PLAYER} colors={playerColors} x={0} y={0} />
          </g>
        </svg>
      </div>
      <p className="world-map__hint">Click a level or use ← → to walk the map.</p>
    </div>
  )
}
