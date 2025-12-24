import React, { useState, useEffect } from 'react'
import ProjectDetail from './ProjectDetail'
import '../styles/ProjectsList.css'

function ProjectsList({ refresh, onRefresh, onNewProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchProjects()
  }, [refresh])

  const fetchProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/projects`)
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      const res = await fetch(`${baseUrl}/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete project')
      onRefresh()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleEdit = (project) => {
    setEditingId(project.id)
    setEditForm(project)
  }

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed to update project')
      setEditingId(null)
      onRefresh()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  if (loading) return <div className="loading">Loading projects...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <>
      <div className="projects-list">
        {projects.length === 0 ? (
          <p className="no-projects">No projects yet. Create one to get started!</p>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                {editingId === project.id ? (
                  <div className="project-edit">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="Project name"
                    />
                    <input
                      type="text"
                      value={editForm.domain || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, domain: e.target.value })
                      }
                      placeholder="Domain"
                    />
                    <select
                      value={editForm.phase || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phase: e.target.value })
                      }
                    >
                      <option value="idea">Idea</option>
                      <option value="prototype">Prototype</option>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button onClick={() => handleSaveEdit(project.id)}>
                      Save
                    </button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="project-content" onClick={() => setSelectedProjectId(project.id)}>
                      <h3>{project.name}</h3>
                      <p className="domain">{project.domain}</p>
                      <p className="phase">
                        Phase: <span className="badge">{project.phase}</span>
                      </p>
                      <p className="complexity">
                        Complexity: <span className="badge">{project.complexity}</span>
                      </p>
                      {project.tags && (
                        <div className="tags">
                          {project.tags.split(',').map((tag, i) => (
                            <span key={i} className="tag">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="project-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(project)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedProjectId && (
        <ProjectDetail
          projectId={selectedProjectId}
          onClose={() => {
            setSelectedProjectId(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

export default ProjectsList
