import React, { useState } from 'react'
import '../styles/ProjectForm.css'

function ProjectForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phase: 'idea',
    complexity: 'medium',
    tags: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create project')
      }

      setFormData({
        name: '',
        domain: '',
        phase: 'idea',
        complexity: 'medium',
        tags: '',
      })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3>Create New Project</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Project Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Domain</label>
        <input
          type="text"
          name="domain"
          value={formData.domain}
          onChange={handleChange}
          placeholder="e.g., Web, Embedded, DevOps"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phase</label>
          <select
            name="phase"
            value={formData.phase}
            onChange={handleChange}
          >
            <option value="idea">Idea</option>
            <option value="prototype">Prototype</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="form-group">
          <label>Complexity</label>
          <select
            name="complexity"
            value={formData.complexity}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., React, Python, Docker"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}

export default ProjectForm
