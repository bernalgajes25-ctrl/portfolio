// Tiny 8-bit sound effects synthesized with the Web Audio API
// (no audio files). Muted by default; the choice is remembered.

let ctx = null
let enabled = false
const listeners = new Set()

try {
  enabled = localStorage.getItem('sfx') === 'on'
} catch {
  // storage unavailable: stay muted
}

export function isSoundOn() {
  return enabled
}

export function setSoundOn(value) {
  enabled = value
  try {
    localStorage.setItem('sfx', value ? 'on' : 'off')
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(enabled))
}

export function onSoundChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// One oscillator note with an optional pitch slide
function tone({ freq, to, dur = 0.08, type = 'square', vol = 0.05, delay = 0 }) {
  if (!enabled) return
  const a = audio()
  const t = a.currentTime + delay
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur)
}

function noise({ dur = 0.2, vol = 0.08 }) {
  if (!enabled) return
  const a = audio()
  const buffer = a.createBuffer(1, a.sampleRate * dur, a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = a.createBufferSource()
  const gain = a.createGain()
  gain.gain.value = vol
  src.buffer = buffer
  src.connect(gain).connect(a.destination)
  src.start()
}

export const sfx = {
  blip: () => tone({ freq: 660, dur: 0.05, vol: 0.04 }),
  select: () => {
    tone({ freq: 523, dur: 0.06 })
    tone({ freq: 784, dur: 0.08, delay: 0.06 })
  },
  shoot: () => tone({ freq: 880, to: 440, dur: 0.06, vol: 0.02 }),
  explode: () => noise({ dur: 0.18, vol: 0.06 }),
  hurt: () => tone({ freq: 220, to: 80, dur: 0.25, type: 'sawtooth', vol: 0.06 }),
  wave: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.08, delay: i * 0.07 })),
  gameOver: () => [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.16, delay: i * 0.15, vol: 0.05 })),
  // Platformer (game version)
  jump: () => tone({ freq: 280, to: 720, dur: 0.14, vol: 0.045 }),
  stomp: () => {
    tone({ freq: 700, to: 140, dur: 0.12, vol: 0.06 })
    tone({ freq: 1047, dur: 0.06, delay: 0.1, vol: 0.04 })
    noise({ dur: 0.1, vol: 0.05 })
  },
  bossHit: () => {
    tone({ freq: 330, to: 165, dur: 0.1, type: 'sawtooth', vol: 0.05 })
    tone({ freq: 220, to: 110, dur: 0.12, type: 'sawtooth', vol: 0.05, delay: 0.1 })
  },
  powerUp: () =>
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.07, delay: i * 0.05 })),
}
