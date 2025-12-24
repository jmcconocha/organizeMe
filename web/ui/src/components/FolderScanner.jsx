import React, { useState } from 'react'
import '../styles/FolderScanner.css'

function FolderScanner({ onImportComplete }) {
  const [scanPath, setScanPath] = useState('')
  const [maxDepth, setMaxDepth] = useState(3)
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [selectedRepos, setSelectedRepos] = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const handleScan = async () => {
    if (!scanPath.trim()) {
      setError('Please enter a path to scan')
      return
    }

    setScanning(true)
    setError('')
    setScanResults(null)
    
    try {
      const res = await fetch(`${baseUrl}/api/scanner/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: scanPath,
          max_depth: maxDepth
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to scan folder')
      }

      const data = await res.json()
      setScanResults(data)
      
      // Auto-select all repos
      setSelectedRepos(new Set(data.discovered_repos.map((_, idx) => idx)))
      
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  const toggleRepo = (index) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRepos(newSelected)
  }

  const handleImport = async () => {
    if (selectedRepos.size === 0) {
      setError('Please select at least one repository to import')
      return
    }

    setImporting(true)
    setError('')

    try {
      const reposToImport = scanResults.discovered_repos
        .filter((_, idx) => selectedRepos.has(idx))
        .map(repo => ({
          name: repo.name,
          local_path: repo.path,
          git_remote_url: repo.remote_url,
          description: repo.description,
          detected_tech_stack: repo.tech_stack
        }))

      const res = await fetch(`${baseUrl}/api/scanner/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reposToImport)
      })

      if (!res.ok) {
        throw new Error('Failed to import projects')
      }

      const imported = await res.json()
      
      // Reset state
      setScanResults(null)
      setScanPath('')
      setSelectedRepos(new Set())
      
      // Notify parent
      if (onImportComplete) {
        onImportComplete(imported)
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="folder-scanner">
      <div className="scanner-header">
        <h2>🔍 Scan Local Folders</h2>
        <p>Discover git repositories on your local machine</p>
      </div>

      <div className="scanner-form">
        <div className="form-group">
          <label>Folder Path</label>
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="/Users/username/Projects"
            disabled={scanning}
          />
        </div>

        <div className="form-group">
          <label>Max Depth</label>
          <input
            type="number"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            min="1"
            max="10"
            disabled={scanning}
          />
          <small>How many folder levels deep to search</small>
        </div>

        <button 
          className="btn-scan"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {scanResults && (
        <div className="scan-results">
          <h3>Found {scanResults.results_count} repositories</h3>
          
          {scanResults.discovered_repos.length === 0 ? (
            <p className="no-results">No git repositories found in this folder</p>
          ) : (
            <>
              <div className="repos-list">
                {scanResults.discovered_repos.map((repo, idx) => (
                  <div key={idx} className="repo-item">
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(idx)}
                      onChange={() => toggleRepo(idx)}
                    />
                    <div className="repo-details">
                      <h4>{repo.name}</h4>
                      <p className="repo-path">{repo.path}</p>
                      {repo.description && (
                        <p className="repo-description">{repo.description}</p>
                      )}
                      {repo.remote_url && (
                        <p className="repo-remote">🔗 {repo.remote_url}</p>
                      )}
                      {repo.tech_stack && (
                        <div className="tech-badges">
                          {repo.tech_stack.languages?.map(lang => (
                            <span key={lang} className="badge badge-language">{lang}</span>
                          ))}
                          {repo.tech_stack.frameworks?.map(fw => (
                            <span key={fw} className="badge badge-framework">{fw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="import-actions">
                <button
                  className="btn-import"
                  onClick={handleImport}
                  disabled={importing || selectedRepos.size === 0}
                >
                  {importing ? 'Importing...' : `Import ${selectedRepos.size} Projects`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FolderScanner
