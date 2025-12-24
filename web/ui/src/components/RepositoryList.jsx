import React, { useState, useEffect } from 'react'
import '../styles/RepositoryList.css'

function RepositoryList({ projectId, gitRemoteUrl, onRepositoryAdded, onSelectRepository }) {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ full_name: '' })
  const [syncing, setSyncing] = useState({})

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (projectId) {
      fetchRepositories()
    }
  }, [projectId, onRepositoryAdded])

  const normalizeFullName = (value) => {
    let normalized = (value || '').trim()
    normalized = normalized.replace(/^git@github\.com:/, '')
    normalized = normalized.replace(/^https?:\/\/github\.com\//, '')
    normalized = normalized.replace(/\.git$/, '')
    return normalized
  }

  const fetchRepositories = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/repositories/project/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch repositories')
      const data = await res.json()
      setRepositories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRepository = async (e) => {
    e.preventDefault()
    const normalizedFullName = normalizeFullName(formData.full_name)

    if (!normalizedFullName) {
      alert('Please enter a repository name (e.g., torvalds/linux)')
      return
    }

    if (!normalizedFullName.includes('/')) {
      alert('Use the format owner/repo, e.g., torvalds/linux')
      return
    }

    try {
      const res = await fetch(`${baseUrl}/api/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: normalizedFullName,
          project_id: projectId,
        }),
      })
      if (!res.ok) {
        let detail = 'Failed to add repository'
        try {
          const data = await res.json()
          if (data?.detail) detail = data.detail
        } catch (err) {
          // ignore JSON parse errors
        }
        throw new Error(`${detail} (${res.status})`)
      }
      
      setFormData({ full_name: '' })
      setShowForm(false)
      fetchRepositories()
      if (onRepositoryAdded) onRepositoryAdded()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleSyncRepository = async (repoId) => {
    setSyncing({ ...syncing, [repoId]: true })
    try {
      const res = await fetch(`${baseUrl}/api/repositories/${repoId}/sync`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to sync repository')
      fetchRepositories()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSyncing({ ...syncing, [repoId]: false })
    }
  }

  const handleRemoveRepository = async (repoId) => {
    if (!confirm('Remove this repository from the project?')) return
    
    try {
      const res = await fetch(`${baseUrl}/api/repositories/${repoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove repository')
      fetchRepositories()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && repositories.length === 0) {
    return <div className="loading">Loading repositories...</div>
  }

  return (
    <div className="repository-list">
      <div className="repository-header">
        <h3>Linked Repositories</h3>
        <button 
          className="btn-add-repo"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Link Repository'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form className="repository-form" onSubmit={handleAddRepository}>
          <input
            type="text"
            placeholder="Repository (e.g., torvalds/linux)"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          {gitRemoteUrl && (
            <button
              type="button"
              className="btn-use-remote"
              onClick={() => setFormData({ full_name: normalizeFullName(gitRemoteUrl) })}
            >
              Use git remote
            </button>
          )}
          <button type="submit">Add Repository</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      {repositories.length === 0 ? (
        <p className="no-repositories">No repositories linked yet</p>
      ) : (
        <div className="repositories">
          {repositories.map((repo) => (
            <div 
              key={repo.id} 
              className="repository-card"
              onClick={() => onSelectRepository && onSelectRepository(repo.id)}
            >
              <div className="repo-header">
                <a 
                  href={repo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="repo-name"
                >
                  {repo.full_name}
                </a>
                <div className="repo-meta">
                  <span className="stars">⭐ {repo.stars?.toLocaleString()}</span>
                  <span className="forks">🍴 {repo.forks?.toLocaleString()}</span>
                  <span className="issues">🔴 {repo.open_issues}</span>
                </div>
              </div>
              
              {repo.description && (
                <p className="repo-description">{repo.description}</p>
              )}
              
              <div className="repo-footer">
                <div className="repo-info">
                  {repo.language && (
                    <span className="language">
                      <span className="dot"></span> {repo.language}
                    </span>
                  )}
                  <span className="last-synced">
                    Synced: {formatDate(repo.last_synced || repo.created_at)}
                  </span>
                </div>
                
                <div className="repo-actions">
                  <button
                    className="btn-sync"
                    onClick={() => handleSyncRepository(repo.id)}
                    disabled={syncing[repo.id]}
                  >
                    {syncing[repo.id] ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveRepository(repo.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RepositoryList
