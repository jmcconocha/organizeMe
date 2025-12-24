import React, { useState } from 'react'
import ProjectsList from '../components/ProjectsList'
import ProjectForm from '../components/ProjectForm'
import FolderScanner from '../components/FolderScanner'
import KanbanBoard from '../components/KanbanBoard'
import ProjectDetail from '../components/ProjectDetail'
import AiSettingsModal from '../components/AiSettingsModal'
import '../styles/ProjectsPage.css'

function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [activeView, setActiveView] = useState('list') // 'list', 'kanban', 'scanner'
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showAiModal, setShowAiModal] = useState(false)

  const handleProjectCreated = () => {
    setShowForm(false)
    setRefresh(refresh + 1)
  }

  const handleImportComplete = (imported) => {
    setRefresh(refresh + 1)
    setActiveView('list')
  }

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId)
  }

  return (
    <div className="projects-page">
      <header className="page-header">
        <h1>Project Portfolio Manager</h1>
        <div className="header-actions">
          <div className="view-tabs">
            <button
              className={`tab ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              📋 List
            </button>
            <button
              className={`tab ${activeView === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveView('kanban')}
            >
              📊 Kanban
            </button>
            <button
              className={`tab ${activeView === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveView('scanner')}
            >
              🔍 Scan Folders
            </button>
          </div>
          {activeView === 'list' && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'New Project'}
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowAiModal(true)}>
            AI Settings
          </button>
        </div>
      </header>

      <main className="page-content">
        {activeView === 'list' && (
          <div className="projects-section">
            <ProjectsList
              refresh={refresh}
              onRefresh={() => setRefresh(refresh + 1)}
              onNewProject={() => setShowForm(true)}
            />
          </div>
        )}

        {activeView === 'kanban' && (
          <KanbanBoard onProjectSelect={handleProjectSelect} />
        )}

        {activeView === 'scanner' && (
          <FolderScanner onImportComplete={handleImportComplete} />
        )}

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <ProjectForm onSuccess={handleProjectCreated} />
            </div>
          </div>
        )}

        {selectedProjectId && (
          <ProjectDetail
            projectId={selectedProjectId}
            onClose={() => setSelectedProjectId(null)}
          />
        )}

        {showAiModal && (
          <AiSettingsModal onClose={() => setShowAiModal(false)} />
        )}
      </main>
    </div>
  )
}

export default ProjectsPage
