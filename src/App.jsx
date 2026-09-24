import { useCallback, useEffect, useRef, useState } from 'react'
import BootScreen from './components/BootScreen.jsx'
import BackgroundBugs from './components/BackgroundBugs.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Journey from './components/Journey.jsx'
import QAProjects from './components/QAProjects.jsx'
import BugReport from './components/BugReport.jsx'
import Skills from './components/Skills.jsx'
import DevProjects from './components/DevProjects.jsx'
import Gallery3D from './components/Gallery3D.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import { sfx } from './sound.js'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

// Achievements for squashing background bugs
const BUG_MILESTONES = {
  1: { title: 'First bug fixed', text: 'Keep clicking: there are more in the background.' },
  10: { title: 'Exterminator', text: '10 bugs fixed. The build is looking cleaner.' },
  25: { title: 'QA legend', text: '25 bugs fixed. Please hire this tester.' },
}

export default function App() {
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  const showToast = useCallback((title, text) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), title, text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // Easter egg: "debug mode" outlines every element on the page
  // and gives the Bug Invaders ship a triple shot.
  const toggleDebug = useCallback(() => {
    const on = document.documentElement.classList.toggle('debug')
    sfx.powerUp()
    if (on) showToast('Cheat unlocked: debug mode', 'Every hitbox is visible and Bug Invaders has triple shot.')
    else showToast('Debug mode off', 'Back to the release build.')
  }, [showToast])

  const onBugKill = useCallback(
    (count) => {
      const milestone = BUG_MILESTONES[count]
      if (milestone) {
        sfx.powerUp()
        showToast(milestone.title, milestone.text)
      }
    },
    [showToast],
  )

  // One-time hint so visitors discover the background bugs
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    try {
      if (sessionStorage.getItem('bug-hint')) return
    } catch {
      // ignore
    }
    const touch = window.matchMedia('(pointer: coarse)').matches
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem('bug-hint', '1')
      } catch {
        // ignore
      }
      showToast('Bugs detected!', `${touch ? 'Tap' : 'Click'} the bugs crawling in the background to fix them.`)
    }, 7000)
    return () => clearTimeout(timer)
  }, [showToast])

  // Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
  useEffect(() => {
    let progress = 0
    const onKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0
      if (progress === KONAMI.length) {
        progress = 0
        toggleDebug()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleDebug])

  // Retro click sound on every link and button (only if sound is on)
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest('a, .btn')) sfx.blip()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <BootScreen />
      <BackgroundBugs onKill={onBugKill} />
      <Navbar />
      <main>
        <Hero onSecret={toggleDebug} />
        <About />
        <Journey />
        <QAProjects />
        <BugReport />
        <Skills />
        <DevProjects />
        <Gallery3D />
        <Contact />
      </main>
      <Footer />
      <Toast key={toast?.id} toast={toast} />
    </>
  )
}
