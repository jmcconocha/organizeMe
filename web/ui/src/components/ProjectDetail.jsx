import React, { useState, useEffect } from 'react'
import RepositoryList from './RepositoryList'
import ActivityTimeline from './ActivityTimeline'
import '../styles/ProjectDetail.css'

function ProjectDetail({ projectId, onClose }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [repositories, setRepositories] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchRepositories()
    }
  }, [projectId, refreshTrigger])

  const fetchProject = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/projects/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      const data = await res.json()
      setProject(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRepositories = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/repositories/project/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch repositories')
      const data = await res.json()
      setRepositories(data)
      // Auto-select first repository if available
      if (data.length > 0 && !selectedRepoId) {
        setSelectedRepoId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching repositories:', err)
    }
  }

  if (loading) {
    return <div className="project-detail-modal"><div className="loading">Loading...</div></div>
  }

  if (error) {
    return (
      <div className="project-detail-modal">
        <div className="modal-content">
          <button className="close-btn" onClick={onClose}>✕</button>
          <div className="error">{error}</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="project-detail-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="project-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Domain</label>
                <p>{project.domain}</p>
              </div>
              <div className="info-item">
                <label>Phase</label>
                <p><span className="badge">{project.phase}</span></p>
              </div>
              <div className="info-item">
                <label>Complexity</label>
                <p><span className="badge">{project.complexity}</span></p>
              </div>
            </div>
            {project.description && (
              <div className="info-section">
                <label>Description</label>
                <p>{project.description}</p>
              </div>
            )}
            {project.tags && (
              <div className="info-section">
                <label>Tags</label>
                <div className="tags">
                  {project.tags.split(',').map((tag, i) => (
                    <span key={i} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <RepositoryList
            token={token}
            baseUrl={baseUrl}
            projectId={projectId}
            onRepositoryAdded={() => {
              setRefreshTrigger(refreshTrigger + 1)
              setSelectedRepoId(null)
            }}
            onSelectRepository={(repoId) => setSelectedRepoId(repoId)}
          />

          {selectedRepoId && (
            <ActivityTimeline
              token={token}
              baseUrl={baseUrl}
              repositoryId={selectedRepoId}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
