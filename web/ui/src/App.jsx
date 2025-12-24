import React, { useState, useEffect, useContext, createContext } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import { AuthContext, AuthProvider } from './context/AuthContext'

function AppContent() {
  const { token } = useContext(AuthContext)

  return (
    <div className="App">
      {!token ? <LoginPage /> : <ProjectsPage />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
