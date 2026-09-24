import { useEffect, useState } from 'react'
import { SPRITE, EYES_ROW } from '../components/Avatar.jsx'
import { avatar } from '../data/portfolio.js'
import { isSoundOn, onSoundChange, setSoundOn, sfx } from '../sound.js'

const EYES_CLOSED = 'OPPSOOSSSSOOSPPO'

// Same palette as the hero avatar, so every version shows the same character
export const AVATAR_COLORS = {
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

export function avatarRows(blink = false) {
  return SPRITE.map((row, y) => (blink && y === EYES_ROW ? EYES_CLOSED : row))
}

// The pixel avatar as an SVG that blinks on its own (no speech bubble)
export function PixelAvatar({ className = '', style }) {
  const [blink, setBlink] = useState(false)

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

  return (
    <svg className={className} style={style} viewBox="0 0 16 20" shapeRendering="crispEdges" aria-hidden="true">
      {avatarRows(blink).flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={AVATAR_COLORS[ch]} />,
        ),
      )}
    </svg>
  )
}

// "♪ ON / OFF" button shared by the alternative versions
export function SoundToggle({ className = 'sound-toggle' }) {
  const [sound, setSound] = useState(isSoundOn)
  useEffect(() => onSoundChange(setSound), [])
  return (
    <button
      className={className}
      aria-pressed={sound}
      aria-label={sound ? 'Mute sound effects' : 'Turn on sound effects'}
      onClick={() => {
        setSoundOn(!sound)
        if (!sound) sfx.select()
      }}
    >
      ♪ {sound ? 'ON' : 'OFF'}
    </button>
  )
}
