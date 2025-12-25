import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'

const THEME_KEY = 'organizeMe.v2.theme'

function ThemeToggle({ value, onChange }) {
  const options = ['light', 'dark', 'system']
  return (
    <div className="toggle">
      {options.map((opt) => (
        <button
          key={opt}
          className={value === opt ? 'active' : ''}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system')
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])
  return (
    <div className="page">
      <header className="header">
        <h1>organizeMe v2</h1>
        <ThemeToggle value={theme} onChange={setTheme} />
      </header>
      <main className="content">
        <p>Clean start. Let’s build exactly what you need.</p>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
