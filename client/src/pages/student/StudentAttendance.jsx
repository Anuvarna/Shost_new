import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/student/attendance').then(d => setAttendance(d.attendance || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const pct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

  return (
    <div>
      <div className="page-header"><h1>My Attendance</h1><p>Your attendance record for the last 30 days</p></div>

      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div><div className="stat-val">{presentCount}</div><div className="stat-label">Present</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">❌</div>
          <div><div className="stat-val">{absentCount}</div><div className="stat-label">Absent</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div><div className="stat-val">{pct}%</div><div className="stat-label">Attendance Rate</div></div>
        </div>
      </div>

      {attendance.length > 0 ? (
        <div className="card">
          <div className="card-title">Attendance Record</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {attendance.map(a => (
              <div key={a.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: a.status === 'present' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${a.status === 'present' ? 'var(--green)' : 'var(--red)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {a.status === 'present' ? '✓' : '✗'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textAlign: 'center' }}>{a.date.slice(5)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.3)', border: '1px solid var(--green)', display: 'inline-block' }} /> Present</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.3)', border: '1px solid var(--red)', display: 'inline-block' }} /> Absent</span>
          </div>
        </div>
      ) : (
        <div className="empty-state"><div className="icon">📅</div><p>No attendance records yet</p></div>
      )}
    </div>
  )
}
