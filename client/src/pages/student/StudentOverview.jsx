import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentOverview({ setActive }) {
  const [profile, setProfile] = useState(null)
  const [notices, setNotices] = useState([])
  const [complaints, setComplaints] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiRequest('/student/profile').catch(() => null),
      apiRequest('/student/notices').catch(() => ({ notices: [] })),
      apiRequest('/student/complaints').catch(() => ({ complaints: [] })),
      apiRequest('/student/attendance').catch(() => ({ attendance: [] })),
    ]).then(([p, n, c, a]) => {
      setProfile(p?.student)
      setNotices(n?.notices?.slice(0, 3) || [])
      setComplaints(c?.complaints?.slice(0, 3) || [])
      setAttendance(a?.attendance?.slice(0, 7) || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  const presentCount = attendance.filter(a => a.status === 'present').length
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {profile?.fullName?.split(' ')[0] || 'Student'} 👋</h1>
        <p>{profile?.hostelId?.name} — {profile?.branch}, Year {profile?.year}</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon purple">🚪</div>
          <div>
            <div className="stat-val">{profile?.roomId?.roomNumber || '—'}</div>
            <div className="stat-label">Room Number</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div>
            <div className="stat-val">Yr {profile?.year || '—'}</div>
            <div className="stat-label">{profile?.branch || 'Branch'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-val">{attendancePct !== null ? `${attendancePct}%` : '—'}</div>
            <div className="stat-label">Attendance (last 7 days)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠️</div>
          <div>
            <div className="stat-val">{complaints.filter(c => c.status !== 'resolved').length}</div>
            <div className="stat-label">Open Complaints</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Notices */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title" style={{ margin: 0 }}>📢 Recent Notices</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActive('notices')}>View All</button>
          </div>
          {notices.length > 0 ? notices.map(n => (
            <div key={n._id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{n.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{new Date(n.publishAt).toLocaleDateString()}</div>
            </div>
          )) : <div className="empty-state" style={{ padding: '1.5rem' }}><p>No active notices</p></div>}
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title" style={{ margin: 0 }}>⚠️ My Complaints</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActive('complaints')}>View All</button>
          </div>
          {complaints.length > 0 ? complaints.map(c => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.type}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`badge badge-${c.status === 'resolved' ? 'resolved' : c.status === 'in_progress' ? 'progress' : 'pending'}`}>{c.status}</span>
            </div>
          )) : <div className="empty-state" style={{ padding: '1.5rem' }}><p>No complaints filed</p></div>}
        </div>
      </div>
    </div>
  )
}
