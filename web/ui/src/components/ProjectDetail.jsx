import React, { useState, useEffect } from 'react'
import RepositoryList from './RepositoryList'
import ActivityTimeline from './ActivityTimeline'
import ProjectTasks from './ProjectTasks'
import ProjectNotes from './ProjectNotes'
import '../styles/ProjectDetail.css'

function ProjectDetail({ projectId, onClose }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [repositories, setRepositories] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [summary, setSummary] = useState(null)
  const [summaryStrategy, setSummaryStrategy] = useState('heuristic')
  const [summaryLoading, setSummaryLoading] = useState(false)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchRepositories()
      fetchSummary(summaryStrategy)
    }
  }, [projectId, refreshTrigger, summaryStrategy])

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

  const fetchSummary = async (strategy = 'heuristic') => {
    setSummaryLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/projects/${projectId}/summary?strategy=${strategy}`)
      if (!res.ok) throw new Error('Failed to fetch project summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      console.error('Error fetching project summary:', err)
    } finally {
      setSummaryLoading(false)
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

        {summary && (
          <div className="project-summary">
            <div className="summary-actions">
              <span className="summary-label">Summary mode:</span>
              <div className="summary-toggle">
                <button
                  className={summaryStrategy === 'heuristic' ? 'toggle active' : 'toggle'}
                  onClick={() => setSummaryStrategy('heuristic')}
                  disabled={summaryStrategy === 'heuristic'}
                >
                  Heuristic
                </button>
                <button
                  className={summaryStrategy === 'ai' ? 'toggle active' : 'toggle'}
                  onClick={() => setSummaryStrategy('ai')}
                  disabled={!summary.ai_available || summaryStrategy === 'ai'}
                  title={summary.ai_available ? 'Use AI-generated summary' : 'AI not configured'}
                >
                  AI
                </button>
                {summaryLoading && <span className="summary-loading">Refreshing...</span>}
              </div>
            </div>
            <div className="summary-row">
              <span className={`health-badge health-${summary.health}`}>{summary.health}</span>
              <span className="summary-text">{summary.summary}</span>
            </div>
            <div className="summary-meta">
              <span>Status: {summary.status}</span>
              <span>Repos: {summary.repo_count}</span>
              <span>Open issues: {summary.open_issues}</span>
            </div>
            {summary.recommendations && summary.recommendations.length > 0 && (
              <ul className="summary-recommendations">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            )}
            {summary.ai_available && (
              <div className="ai-note">AI agent available; toggle to AI for model-generated summary.</div>
            )}
          </div>
        )}

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
            {(project.local_path || project.git_remote_url) && (
              <div className="info-section">
                <label>Links</label>
                <div className="project-links">
                  {project.local_path && (
                    <a href={`vscode://file${project.local_path}`} className="link-btn">
                      📂 Open in VS Code
                    </a>
                  )}
                  {project.git_remote_url && (
                    <a
                      href={project.git_remote_url.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn"
                    >
                      🔗 Open on GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <RepositoryList
            projectId={projectId}
            gitRemoteUrl={project.git_remote_url}
            onRepositoryAdded={() => {
              setRefreshTrigger(refreshTrigger + 1)
              setSelectedRepoId(null)
            }}
            onSelectRepository={(repoId) => setSelectedRepoId(repoId)}
          />

          {selectedRepoId && (
            <ActivityTimeline
              repositoryId={selectedRepoId}
            />
          )}

          <div className="project-panels">
            <ProjectTasks projectId={projectId} />
            <ProjectNotes projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
