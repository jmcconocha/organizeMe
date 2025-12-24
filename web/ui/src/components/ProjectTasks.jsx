import React, { useState, useEffect } from 'react'

const STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

function ProjectTasks({ projectId }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo' })
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (projectId) fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/kanban/projects/${projectId}/tasks`)
      if (!res.ok) throw new Error('Failed to load tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    try {
      const res = await fetch(`${baseUrl}/api/kanban/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          project_id: projectId,
        }),
      })
      if (!res.ok) throw new Error('Failed to add task')
      setNewTask({ title: '', description: '', status: 'todo' })
      fetchTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const res = await fetch(`${baseUrl}/api/kanban/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update task')
      fetchTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`${baseUrl}/api/kanban/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      setTasks(tasks.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const grouped = STATUSES.map((s) => ({
    ...s,
    items: tasks.filter((t) => t.status === s.id),
  }))

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Tasks</h3>
      </div>
      {error && <div className="error">{error}</div>}
      <form className="inline-form" onSubmit={addTask}>
        <input
          type="text"
          placeholder="Task title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <select
          value={newTask.status}
          onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="task-columns">
          {grouped.map((col) => (
            <div key={col.id} className="task-column">
              <div className="task-column-header">
                <span>{col.label}</span>
                <span className="count">{col.items.length}</span>
              </div>
              {col.items.length === 0 && (
                <div className="empty">No tasks</div>
              )}
              {col.items.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteTask(task.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectTasks
