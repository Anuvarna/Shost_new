import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenAttendance() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [viewMode, setViewMode] = useState('mark')
  const [history, setHistory] = useState([])
  const [existingRecord, setExistingRecord] = useState(null)

  useEffect(() => {
    apiRequest('/warden/attendance/students').then(d => {
      const s = d.students || []
      setStudents(s)
      const init = {}
      s.forEach(st => { init[st._id] = 'present' })
      setAttendance(init)
    }).finally(() => setLoading(false))
  }, [])

  // When date changes in mark mode, check if attendance already exists
  useEffect(() => {
    if (viewMode !== 'mark') return
    apiRequest(`/warden/attendance/${date}`).then(d => {
      if (d.attendance) {
        setExistingRecord(d.attendance)
        // Pre-fill attendance from existing record
        const existing = {}
        d.attendance.records.forEach(r => {
          const id = r.studentId?._id || r.studentId
          if (id) existing[id] = r.status
        })
        setAttendance(prev => ({ ...prev, ...existing }))
      } else {
        setExistingRecord(null)
        // Reset to all present
        const init = {}
        students.forEach(st => { init[st._id] = 'present' })
        setAttendance(init)
      }
    }).catch(() => { setExistingRecord(null) })
  }, [date, viewMode])

  const toggle = (id) => setAttendance(prev => ({ ...prev, [id]: prev[id] === 'present' ? 'absent' : 'present' }))
  const markAll = (status) => {
    const a = {}
    students.forEach(s => { a[s._id] = status })
    setAttendance(a)
  }

  const submit = async () => {
    setSubmitting(true); setMsg(null)
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'present' }))
      const res = await apiRequest('/warden/attendance/submit', { method: 'POST', body: { date, records } })
      setMsg({ type: 'success', text: `Attendance ${existingRecord ? 'updated' : 'submitted'} for ${date}. ${res.absentCount} absent.` })
      setExistingRecord(true)
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSubmitting(false) }
  }

  const loadHistory = async () => {
    const res = await apiRequest('/warden/attendance/history/all').catch(() => ({ history: [] }))
    setHistory(res.history || [])
    setViewMode('history')
  }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  // Group by room
  const grouped = {}
  students.forEach(s => {
    const key = s.roomId?.roomNumber || 'Unallocated'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Attendance</h1><p>Mark and manage daily student attendance</p></div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
        <button className={`btn ${viewMode === 'mark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('mark')}>Mark Attendance</button>
        <button className={`btn ${viewMode === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={loadHistory}>View History</button>
      </div>

      {viewMode === 'mark' && (
        <>
          {existingRecord && (
            <div className="alert alert-info mb-2">
              Attendance already submitted for {date}. You can update it below.
            </div>
          )}
          {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

          <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card"><div className="stat-icon green" /><div><div className="stat-val">{presentCount}</div><div className="stat-label">Present</div></div></div>
            <div className="stat-card"><div className="stat-icon red" /><div><div className="stat-val">{absentCount}</div><div className="stat-label">Absent</div></div></div>
            <div className="stat-card"><div className="stat-icon blue" /><div><div className="stat-val">{students.length}</div><div className="stat-label">Total</div></div></div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button className="btn btn-success btn-sm" onClick={() => markAll('present')}>Mark All Present</button>
            <button className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>Mark All Absent</button>
          </div>

          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([room, roomStudents]) => (
            <div key={room} className="card mb-2">
              <div style={{ fontWeight: 700, color: 'var(--purple3)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Room {room}
              </div>
              {roomStudents.map((s, i) => (
                <div
                  key={s._id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: i < roomStudents.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onClick={() => toggle(s._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      border: `2px solid ${attendance[s._id] === 'present' ? 'var(--green)' : 'var(--red)'}`,
                      background: attendance[s._id] === 'present' ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.8rem', flexShrink: 0,
                    }}>
                      {attendance[s._id] === 'present' && '✓'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.branch} — Yr {s.year}</div>
                    </div>
                  </div>
                  <span className={`badge ${attendance[s._id] === 'present' ? 'badge-present' : 'badge-absent'}`}>
                    {attendance[s._id] === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={submit} disabled={submitting || students.length === 0}>
              {submitting ? 'Saving...' : existingRecord ? `Update Attendance for ${date}` : `Submit Attendance for ${date}`}
            </button>
          </div>
        </>
      )}

      {viewMode === 'history' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Total</th><th>Rate</th></tr></thead>
            <tbody>
              {history.map(h => {
                const total = h.present + h.absent
                const pct = total > 0 ? Math.round((h.present / total) * 100) : 0
                return (
                  <tr key={h.date}>
                    <td style={{ fontWeight: 600 }}>{h.date}</td>
                    <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{h.present}</span></td>
                    <td><span style={{ color: 'var(--red)', fontWeight: 600 }}>{h.absent}</span></td>
                    <td>{total}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 80, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && <tr><td colSpan={5}><div className="empty-state"><p>No attendance records yet</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
