import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenMovement() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [filterDate, setFilterDate] = useState(true)

  const load = (d) => {
    setLoading(true)
    const url = filterDate && d ? `/warden/movement?date=${d}` : '/warden/movement'
    apiRequest(url).then(r => setMovements(r.movements || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load(date) }, [date, filterDate])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Movement Tracking</h1><p>Students who have registered going home</p></div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} disabled={!filterDate} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text2)' }}>
          <input type="checkbox" checked={filterDate} onChange={e => setFilterDate(e.target.checked)} />
          Filter by date
        </label>
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>{movements.length} records</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Room</th><th>Destination</th><th>Leave</th><th>Return</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {movements.map(m => (
              <tr key={m._id}>
                <td>
                  <div className="fw-600">{m.studentId?.fullName || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{m.studentId?.admissionNumber}</div>
                </td>
                <td>{m.studentId?.roomId?.roomNumber || '—'}</td>
                <td>{m.destination}</td>
                <td style={{ fontSize: '0.8rem' }}>{m.leaveDate} {m.leaveTime}</td>
                <td style={{ fontSize: '0.8rem' }}>{m.returnDate} {m.returnTime}</td>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reason || '—'}</td>
                <td><span className={`badge ${m.status === 'returned' ? 'badge-present' : 'badge-pending'}`}>{m.status}</span></td>
              </tr>
            ))}
            {movements.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="icon">🚶</div><p>No movement records for this date</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
