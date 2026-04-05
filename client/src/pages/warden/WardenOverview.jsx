import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/warden/dashboard').then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, Warden 👋</h1>
        <p>{data?.hostel?.name} — {data?.hostel?.gender} Hostel</p>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon purple">🎓</div>
          <div><div className="stat-val">{data?.totalStudents ?? '—'}</div><div className="stat-label">Total Students</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🚪</div>
          <div><div className="stat-val">{data?.totalRooms ?? '—'}</div><div className="stat-label">Rooms</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠️</div>
          <div><div className="stat-val">{data?.pendingComplaints ?? '—'}</div><div className="stat-label">Pending Complaints</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">❌</div>
          <div><div className="stat-val">{data?.absentToday ?? '—'}</div><div className="stat-label">Absent Today</div></div>
        </div>
      </div>
    </div>
  )
}
