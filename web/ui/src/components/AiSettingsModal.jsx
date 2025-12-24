import React, { useEffect, useState } from 'react'
import '../styles/ProjectsPage.css'

function AiSettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const [githubToken, setGithubToken] = useState('')
  const [githubStatus, setGithubStatus] = useState('')
  const [githubLoading, setGithubLoading] = useState(false)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [aiRes, ghRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/ai-config`),
          fetch(`${baseUrl}/api/admin/github-config`)
        ])

        if (!aiRes.ok) throw new Error('Failed to load AI config')
        const aiData = await aiRes.json()
        if (aiData.model) setModel(aiData.model)
        setStatus(aiData.ai_enabled ? 'AI is configured.' : 'AI not configured yet.')

        if (!ghRes.ok) throw new Error('Failed to load GitHub config')
        const ghData = await ghRes.json()
        setGithubStatus(ghData.github_enabled ? 'GitHub token is set.' : 'GitHub token not set yet.')
      } catch (err) {
        setStatus(`Unable to load config: ${err.message}`)
      }
    }
    loadConfig()
  }, [])

  const saveAi = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch(`${baseUrl}/api/admin/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, model })
      })
      if (!res.ok) throw new Error('Failed to save AI config')
      setStatus('Saved. AI summaries enabled.')
      setApiKey('')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const saveGithub = async (e) => {
    e.preventDefault()
    setGithubLoading(true)
    setGithubStatus('')
    try {
      const res = await fetch(`${baseUrl}/api/admin/github-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken })
      })
      if (!res.ok) throw new Error('Failed to save GitHub token')
      setGithubStatus('Saved. Private repo access enabled.')
      setGithubToken('')
    } catch (err) {
      setGithubStatus(`Error: ${err.message}`)
    } finally {
      setGithubLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Integrations</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="helper">Provide keys to enable integrations. Keys are kept in-memory only (dev use).</p>

          <form className="ai-form" onSubmit={saveAi}>
            <h3>AI (OpenAI)</h3>
            <label>API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <label>Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <div className="form-actions">
              <button type="submit" disabled={loading || !apiKey.trim()}>
                {loading ? 'Saving...' : 'Save AI Settings'}
              </button>
              <button type="button" className="secondary" onClick={onClose}>Close</button>
            </div>
            {status && <div className="status-text">{status}</div>}
          </form>

          <form className="ai-form" onSubmit={saveGithub}>
            <h3>GitHub</h3>
            <label>Personal Access Token</label>
            <input
              type="password"
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <div className="form-actions">
              <button type="submit" disabled={githubLoading || !githubToken.trim()}>
                {githubLoading ? 'Saving...' : 'Save GitHub Token'}
              </button>
            </div>
            {githubStatus && <div className="status-text">{githubStatus}</div>}
          </form>
        </div>
      </div>
    </div>
  )}

export default AiSettingsModal
