import { games, journey, skills } from '../../data/portfolio.js'

// ------------------------------------------------------------
//  LEVEL LAYOUT
//  Units are "sprite pixels" (the avatar is 16x20). x grows to
//  the right; y = 0 is the ground surface and negative is up.
//  Every object with a `panel` can be opened with E / ↓.
// ------------------------------------------------------------

// Sections of the portfolio, used by the HUD and the quick menu
export const ZONES = [
  { id: 'about', label: 'Profile', icon: '⌂' },
  { id: 'journey', label: 'Journey', icon: '⚑' },
  { id: 'report', label: 'Bug report', icon: '✎' },
  { id: 'games', label: 'Games', icon: '▣' },
  { id: 'skills', label: 'Skills', icon: '?' },
  { id: 'dev', label: 'Dev & 3D', icon: '⚙' },
  { id: 'contact', label: 'Contact', icon: '✉' },
]

// Colors taken from the site palette (Sweetie 16)
export const PAL = {
  night: '#1a1c2c',
  purple: '#5d275d',
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  green: '#38b764',
  teal: '#257179',
  navy: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  white: '#f4f4f4',
  light: '#94b0c2',
  gray: '#566c86',
  dark: '#333c57',
  ink: '#0d0e18',
}

export function buildLevel() {
  const objects = []
  const blocks = []
  const bugs = []
  const zoneX = {}
  let x = 40

  const sign = (lines, panel) => {
    objects.push({ type: 'sign', x, y: -30, w: 56, h: 30, lines, panel })
    x += 90
  }
  const bug = (from, to, big = false) =>
    bugs.push({ from, to, big, x: from, vx: big ? 28 : 22 + (from % 7) * 2, alive: true })

  // Start
  sign(['← → MOVE', 'SPACE JUMP', 'E OPEN'])
  bug(x - 10, x + 40)

  // Profile house
  zoneX.about = x
  objects.push({ type: 'house', x, y: -64, w: 84, h: 64, panel: 'about', label: 'PROFILE' })
  x += 140
  bug(x - 40, x + 10)

  // Journey: one flag per level, plus a locked one
  zoneX.journey = x
  sign(['WORLD MAP', 'CAREER →'])
  journey.forEach((j, i) => {
    objects.push({
      type: 'flag',
      x,
      y: -64,
      w: 24,
      h: 64,
      panel: `journey:${i}`,
      level: j.level,
      kind: j.type,
      current: j.current,
      raise: 0,
    })
    x += 60
  })
  objects.push({ type: 'flag', x, y: -64, w: 24, h: 64, panel: 'locked', level: '???', kind: 'locked', raise: 0 })
  x += 90
  bug(x - 60, x)

  // Bug report terminal, guarded by the "critical bug"
  zoneX.report = x
  objects.push({ type: 'terminal', x, y: -36, w: 40, h: 36, panel: 'report', label: 'BUG REPORT' })
  x += 70
  bug(x, x + 90, true)
  x += 150

  // Arcade: one cabinet per tested game
  zoneX.games = x
  sign([`${games.length} GAMES`, 'TESTED →'], 'games')
  games.forEach((g, i) => {
    objects.push({ type: 'cabinet', x, y: -48, w: 28, h: 48, panel: `game:${i}`, index: i, color: i % 4 })
    x += 40
  })
  x += 30
  bug(x - 50, x + 20)

  // Skills: ? blocks, hit them from below
  zoneX.skills = x
  sign(['SKILL BLOCKS', 'JUMP ↑ HIT'], 'skills')
  skills.forEach((g) => {
    blocks.push({ x, y: -50, w: 16, h: 16, group: g.group, items: g.items, hits: 0, bump: 0 })
    x += 76
  })
  x += 20
  bug(x - 40, x + 30)

  // Dev projects + Blender renders
  zoneX.dev = x
  objects.push({ type: 'workshop', x, y: -40, w: 60, h: 40, panel: 'dev', label: 'DEV & 3D' })
  x += 110
  bug(x - 20, x + 40)

  // Goal: flag pole + castle (contact)
  zoneX.contact = x
  sign(['LAST LEVEL', 'CONTACT →'], 'contact')
  x += 20
  objects.push({ type: 'pole', x, y: -110, w: 8, h: 110, panel: 'contact', flag: 0 })
  x += 70
  objects.push({ type: 'castle', x, y: -80, w: 100, h: 80, panel: 'contact', label: 'CONTACT' })
  x += 160

  return { objects, blocks, bugs, zoneX, end: x }
}
