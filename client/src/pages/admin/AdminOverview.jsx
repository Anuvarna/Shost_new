import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function AdminOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/admin/dashboard').then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Real-time overview of all hostel operations</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon purple">🎓</div>
          <div><div className="stat-val">{data?.totalStudents ?? '—'}</div><div className="stat-label">Total Students</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🛡️</div>
          <div><div className="stat-val">{data?.totalWardens ?? '—'}</div><div className="stat-label">Wardens</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏠</div>
          <div><div className="stat-val">{data?.totalHostels ?? '—'}</div><div className="stat-label">Hostels</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Hostel Summary</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Hostel</th><th>Gender</th><th>Students</th><th>Wardens</th></tr></thead>
            <tbody>
              {data?.hostelStats?.map(h => (
                <tr key={h._id}>
                  <td className="fw-600">{h.name}</td>
                  <td><span className={`badge badge-${h.gender?.toLowerCase()}`}>{h.gender}</span></td>
                  <td>{h.studentCount}</td>
                  <td>{h.wardenCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
