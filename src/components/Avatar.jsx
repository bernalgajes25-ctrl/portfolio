import { useEffect, useRef, useState } from 'react'
import { avatar } from '../data/portfolio.js'
import { sfx } from '../sound.js'

// 16x20 pixel sprite. Each character is one pixel:
// O outline · H hair · S skin · W eye white · E pupil · M mouth
// P headset · T shirt · C controller · "." transparent
export const SPRITE = [
  '....OOOOOOOO....',
  '...OPPPPPPPPO...',
  '..OPHHHHHHHHPO..',
  '.OPHHHHHHHHHHPO.',
  '.OHHHHHHHHHHHHO.',
  'OPPHSSSSSSSSHPPO',
  'OPPSSSSSSSSSSPPO',
  'OPPSWESSSSWESPPO',
  'OPPSSSSSSSSSSPPO',
  '.OHSSSSSSSSSSHO.',
  '.OHSSSSMMSSSSHO.',
  '.OHHSSSSSSSSHHO.',
  '.OHHOOSSSSOOHHO.',
  '.OOOTTOSSOTTOOO.',
  '.OTTTTTTTTTTTTO.',
  '.OTTTTTTTTTTTTO.',
  '.OTTTTTTTTTTTTO.',
  '.OTTTTCCCCTTTTO.',
  '.OTTTCCCCCCTTTO.',
  '.OOOOOOOOOOOOOO.',
]
export const EYES_ROW = 7
const EYES_CLOSED = 'OPPSOOSSSSOOSPPO'

// Clicking the avatar this many times in a row triggers the easter egg
const SECRET_CLICKS = 5

export default function Avatar({ onSecret }) {
  const [blink, setBlink] = useState(false)
  const [line, setLine] = useState(0)
  const clicks = useRef({ count: 0, last: 0 })

  // Blink every few seconds
  useEffect(() => {
    let timeout
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 150)
        loop()
      }, 2500 + Math.random() * 2500)
    }
    loop()
    return () => clearTimeout(timeout)
  }, [])

  const colors = {
    O: '#0d0e18',
    H: avatar.hair,
    S: avatar.skin,
    W: '#f4f4f4',
    E: '#0d0e18',
    M: '#b13e53',
    P: avatar.headset,
    T: avatar.shirt,
    C: '#333c57',
  }

  const onClick = () => {
    sfx.select()
    setLine((l) => (l + 1) % avatar.lines.length)

    const now = Date.now()
    const c = clicks.current
    c.count = now - c.last < 600 ? c.count + 1 : 1
    c.last = now
    if (c.count >= SECRET_CLICKS) {
      c.count = 0
      onSecret?.()
    }
  }

  const rows = SPRITE.map((row, y) => (blink && y === EYES_ROW ? EYES_CLOSED : row))

  return (
    <div className="avatar">
      <button className="avatar__sprite" onClick={onClick} aria-label="Pixel avatar, click to talk">
        <svg viewBox="0 0 16 20" shapeRendering="crispEdges" aria-hidden="true">
          {rows.flatMap((row, y) =>
            [...row].map((ch, x) =>
              ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[ch]} />,
            ),
          )}
        </svg>
      </button>
      <p className="avatar__bubble" aria-live="polite">
        {avatar.lines[line]}
      </p>
    </div>
  )
}
