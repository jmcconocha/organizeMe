import React, { useState, useEffect } from 'react'

function ProjectNotes({ projectId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState({ content: '', tags: '' })
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (projectId) fetchNotes()
  }, [projectId])

  const fetchNotes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/notes?project_id=${projectId}`)
      if (!res.ok) throw new Error('Failed to load notes')
      const data = await res.json()
      setNotes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async (e) => {
    e.preventDefault()
    if (!draft.content.trim()) return
    try {
      const res = await fetch(`${baseUrl}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.content,
          tags: draft.tags,
          project_id: projectId,
        }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      setDraft({ content: '', tags: '' })
      fetchNotes()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return
    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete note')
      setNotes(notes.filter((n) => n.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Notes</h3>
      </div>
      {error && <div className="error">{error}</div>}
      <form className="inline-form" onSubmit={addNote}>
        <textarea
          placeholder="Write a quick note or decision..."
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={draft.tags}
          onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
        />
        <button type="submit">Add Note</button>
      </form>
      {loading ? (
        <div className="loading">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="empty">No notes yet</div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-meta">
                <span>{new Date(note.created_at).toLocaleString()}</span>
                {note.tags && <span className="note-tags">{note.tags}</span>}
              </div>
              <div className="note-content">{note.content}</div>
              <div className="note-actions">
                <button onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectNotes
