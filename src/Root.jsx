import { useState } from 'react'
import App from './App.jsx'
import ScrollPortfolio from './variants/scroll/ScrollPortfolio.jsx'
import GamePortfolio from './variants/game/GamePortfolio.jsx'
import PortfolioSwitcher from './components/PortfolioSwitcher.jsx'
import ModeSelect from './components/ModeSelect.jsx'

// The three versions of the portfolio. "classic" is the original site.
export const VARIANTS = [
  {
    id: 'classic',
    label: 'Classic',
    icon: '▤',
    time: 'Quick read · 2 min',
    hint: 'The original one-page portfolio',
    blurb: 'Everything on one page: projects, bug report, skills and contact. Best if you are in a hurry.',
  },
  {
    id: 'scroll',
    label: 'Cinematic',
    icon: '▼',
    time: 'Scroll story · 4 min',
    hint: 'Scroll-driven animated scenes',
    blurb: 'Scroll and each chapter comes to life with animations, like a game trailer site.',
  },
  {
    id: 'game',
    label: 'Game',
    icon: '▶',
    time: 'Play · 5 min',
    hint: 'Play the portfolio as a platformer',
    blurb: 'A tiny platformer: walk, jump, squash bugs and open each section in the level.',
  },
]

const isVariant = (id) => VARIANTS.some((v) => v.id === id)

function savedVariant() {
  try {
    return localStorage.getItem('portfolio-variant')
  } catch {
    return null
  }
}

// ?v=... wins, then the last choice. First-time visitors (or ?select) see the mode screen.
function initialState() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('v')
  if (isVariant(fromUrl)) return { variant: fromUrl, choosing: false }
  const saved = savedVariant()
  return { variant: isVariant(saved) ? saved : 'classic', choosing: params.has('select') || !isVariant(saved) }
}

export default function Root() {
  const [{ variant, choosing }, setState] = useState(initialState)
  const [justChose, setJustChose] = useState(false)

  const change = (id, fromSelect = false) => {
    if (id === variant && !choosing) return
    try {
      localStorage.setItem('portfolio-variant', id)
    } catch {
      // ignore
    }
    const url = new URL(window.location.href)
    url.searchParams.set('v', id)
    url.searchParams.delete('select')
    url.hash = ''
    window.history.replaceState(null, '', url)
    // Classic-only state that should not leak into other versions
    document.documentElement.classList.remove('debug')
    window.scrollTo(0, 0)
    setState({ variant: id, choosing: false })
    if (fromSelect) setJustChose(true)
  }

  if (choosing) return <ModeSelect variants={VARIANTS} initial={variant} onPick={(id) => change(id, true)} />

  return (
    <>
      {variant === 'classic' && <App />}
      {variant === 'scroll' && <ScrollPortfolio />}
      {variant === 'game' && <GamePortfolio />}
      <PortfolioSwitcher variants={VARIANTS} current={variant} onChange={change} highlight={justChose} />
    </>
  )
}
