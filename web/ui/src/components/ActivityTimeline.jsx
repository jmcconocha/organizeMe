import React, { useState, useEffect } from 'react'
import '../styles/ActivityTimeline.css'

function ActivityTimeline({ repositoryId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all')

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (repositoryId) {
      fetchActivities()
    }
  }, [repositoryId])

  const fetchActivities = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/repositories/${repositoryId}/activities`)
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'commit':
        return '📝'
      case 'pull_request':
        return '🔀'
      case 'issue':
        return '🔴'
      case 'release':
        return '🎉'
      default:
        return '📌'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'commit':
        return 'activity-commit'
      case 'pull_request':
        return 'activity-pr'
      case 'issue':
        return 'activity-issue'
      case 'release':
        return 'activity-release'
      default:
        return 'activity-default'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days === 0) {
      if (hours === 0) return 'just now'
      return `${hours}h ago`
    } else if (days === 1) {
      return 'yesterday'
    } else if (days < 7) {
      return `${days}d ago`
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.activity_type === filter)

  const activityCounts = {
    all: activities.length,
    commit: activities.filter(a => a.activity_type === 'commit').length,
    pull_request: activities.filter(a => a.activity_type === 'pull_request').length,
    issue: activities.filter(a => a.activity_type === 'issue').length,
    release: activities.filter(a => a.activity_type === 'release').length,
  }

  if (loading) {
    return <div className="loading">Loading activities...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (activities.length === 0) {
    return <div className="no-activities">No activity yet</div>
  }

  return (
    <div className="activity-timeline">
      <div className="timeline-header">
        <h4>Recent Activity</h4>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({activityCounts.all})
          </button>
          <button
            className={`filter-btn ${filter === 'commit' ? 'active' : ''}`}
            onClick={() => setFilter('commit')}
          >
            Commits ({activityCounts.commit})
          </button>
          <button
            className={`filter-btn ${filter === 'pull_request' ? 'active' : ''}`}
            onClick={() => setFilter('pull_request')}
          >
            PRs ({activityCounts.pull_request})
          </button>
          <button
            className={`filter-btn ${filter === 'issue' ? 'active' : ''}`}
            onClick={() => setFilter('issue')}
          >
            Issues ({activityCounts.issue})
          </button>
          <button
            className={`filter-btn ${filter === 'release' ? 'active' : ''}`}
            onClick={() => setFilter('release')}
          >
            Releases ({activityCounts.release})
          </button>
        </div>
      </div>

      <div className="timeline-events">
        {filteredActivities.slice(0, 20).map((activity) => (
          <div 
            key={activity.id} 
            className={`timeline-event ${getActivityColor(activity.activity_type)}`}
          >
            <div className="event-marker">
              <span className="event-icon">{getActivityIcon(activity.activity_type)}</span>
            </div>
            
            <div className="event-content">
              <div className="event-header">
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-title"
                >
                  {activity.title}
                </a>
                <span className="event-time">{formatDate(activity.timestamp)}</span>
              </div>
              
              {activity.description && (
                <div className="event-description">
                  <p>
                    {expandedId === activity.id
                      ? activity.description
                      : activity.description.substring(0, 150) +
                        (activity.description.length > 150 ? '...' : '')
                    }
                  </p>
                  {activity.description.length > 150 && (
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedId(
                        expandedId === activity.id ? null : activity.id
                      )}
                    >
                      {expandedId === activity.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}
              
              <div className="event-meta">
                <span className="author">by {activity.author}</span>
                <span className="type">{activity.activity_type.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length > 20 && (
        <div className="timeline-footer">
          Showing 20 of {filteredActivities.length} activities
        </div>
      )}
    </div>
  )
}

export default ActivityTimeline
