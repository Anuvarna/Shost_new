// StudentNotices.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export function StudentNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/student/notices').then(d => setNotices(d.notices || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Notices</h1><p>Active announcements from your warden</p></div>
      {notices.length === 0
        ? <div className="empty-state"><div className="icon">📢</div><p>No active notices right now</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notices.map(n => (
              <div key={n._id} className="card" style={{ borderLeft: '3px solid var(--purple2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    Until {new Date(n.takedownAt).toLocaleDateString()}
                  </div>
                </div>
                {n.description && <div style={{ color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>{n.description}</div>}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Posted by {n.createdBy?.name} · {new Date(n.publishAt).toLocaleDateString()}</span>
                  {n.imagePath && <a href={n.imagePath} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📷 View Image</a>}
                  {n.pdfPath && <a href={n.pdfPath} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📄 View PDF</a>}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default StudentNotices
