import React, { useState, useEffect } from 'react'
import '../styles/KanbanBoard.css'

function KanbanBoard({ onProjectSelect }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draggedProject, setDraggedProject] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [healthFilter, setHealthFilter] = useState('all')

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const columns = [
    { id: 'backlog', title: 'Backlog', color: '#9E9E9E' },
    { id: 'in-progress', title: 'In Progress', color: '#2196F3' },
    { id: 'review', title: 'Review', color: '#FF9800' },
    { id: 'done', title: 'Done', color: '#4CAF50' }
  ]

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (projects.length) fetchSummaries(projects)
  }, [projects])

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

  const fetchSummaries = async (list) => {
    try {
      const entries = await Promise.all(
        list.map(async (p) => {
          try {
            const res = await fetch(`${baseUrl}/api/projects/${p.id}/summary`)
            if (!res.ok) throw new Error('Failed summary')
            const data = await res.json()
            return [p.id, data]
          } catch {
            return [p.id, null]
          }
        })
      )
      setSummaries(Object.fromEntries(entries))
    } catch (err) {
      console.error('Error fetching summaries', err)
    }
  }

  const getProjectsByStatus = (status) => {
    const filtered = projects
      .filter(p => p.status === status)
      .filter(p => {
        if (healthFilter === 'all') return true
        const summary = summaries[p.id]
        if (!summary) return false
        return summary.health === healthFilter
      })
      .sort((a, b) => a.position - b.position)
    return filtered
  }

  const handleDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    
    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null)
      return
    }

    try {
      const res = await fetch(
        `${baseUrl}/api/kanban/projects/${draggedProject.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        }
      )

      if (!res.ok) throw new Error('Failed to update project status')

      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === draggedProject.id ? { ...p, status: newStatus } : p
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setDraggedProject(null)
    }
  }

  if (loading) return <div className="kanban-loading">Loading...</div>
  if (error) return <div className="kanban-error">Error: {error}</div>

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>📊 Project Kanban</h2>
        <p>Drag projects between columns to track progress</p>
        <div className="kanban-filters">
          <label>Health filter:</label>
          <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="stale">Stale</option>
            <option value="dormant">Dormant</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="kanban-columns">
        {columns.map(column => (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div 
              className="column-header"
              style={{ borderTopColor: column.color }}
            >
              <h3>{column.title}</h3>
              <span className="count">{getProjectsByStatus(column.id).length}</span>
            </div>

            <div className="column-content">
              {getProjectsByStatus(column.id).map(project => (
                <div
                  key={project.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, project)}
                  onClick={() => onProjectSelect && onProjectSelect(project.id)}
                >
                  <h4>{project.name}</h4>
                  {summaries[project.id] && (
                    <div className="card-health">
                      <span className={`health-dot health-${summaries[project.id].health}`}></span>
                      <span className="health-text">{summaries[project.id].health}</span>
                      {summaries[project.id].last_activity_at && (
                        <span className="health-meta">
                          Last activity {new Date(summaries[project.id].last_activity_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  {project.domain && (
                    <span className="card-domain">{project.domain}</span>
                  )}
                  {project.description && (
                    <p className="card-description">{project.description}</p>
                  )}
                  <div className="card-footer">
                    <span className={`phase-badge phase-${project.phase}`}>
                      {project.phase}
                    </span>
                    {project.detected_tech_stack?.languages && (
                      <div className="tech-icons">
                        {project.detected_tech_stack.languages.slice(0, 3).map(lang => (
                          <span key={lang} className="tech-icon" title={lang}>
                            {lang.charAt(0)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {getProjectsByStatus(column.id).length === 0 && (
                <div className="empty-column">
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
