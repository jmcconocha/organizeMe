import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import ProjectsList from '../components/ProjectsList'
import ProjectForm from '../components/ProjectForm'
import '../styles/ProjectsPage.css'

function ProjectsPage() {
  const { token, logout } = useContext(AuthContext)
  const [showForm, setShowForm] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const handleLogout = () => {
    logout()
  }

  const handleProjectCreated = () => {
    setShowForm(false)
    setRefresh(refresh + 1)
  }

  return (
    <div className="projects-page">
      <header className="page-header">
        <h1>Project Portfolio Manager</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="page-content">
        <div className="projects-section">
          <div className="section-header">
            <h2>Projects</h2>
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'New Project'}
            </button>
          </div>

          {showForm && (
            <ProjectForm
              token={token}
              baseUrl={baseUrl}
              onSuccess={handleProjectCreated}
            />
          )}

          <ProjectsList
            token={token}
            baseUrl={baseUrl}
            refresh={refresh}
            onRefresh={() => setRefresh(refresh + 1)}
          />
        </div>
      </main>
    </div>
  )
}

export default ProjectsPage
