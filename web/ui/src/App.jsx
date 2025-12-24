import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const res = await fetch(`${baseUrl}/healthz`)
        if (res.ok) {
          setApiStatus('✓ API healthy')
          const projectsRes = await fetch(`${baseUrl}/api/projects`)
          const data = await projectsRes.json()
          setProjects(data.projects || [])
        } else {
          setApiStatus('✗ API unhealthy')
        }
      } catch (err) {
        setApiStatus(`✗ Error: ${err.message}`)
      }
    }
    checkAPI()
  }, [])

  return (
    <div className="App">
      <h1>Project Portfolio Manager</h1>
      <p>API Status: {apiStatus}</p>
      <h2>Projects ({projects.length})</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
