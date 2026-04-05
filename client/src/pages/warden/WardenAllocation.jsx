import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenAllocation() {
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [slipEnabled, setSlipEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState({ studentId: '', roomId: '' })
  const [saving, setSaving] = useState(false)
  const [togglingSlip, setTogglingSlip] = useState(false)

  // Year filter for allocation and table view
  const [selectedYear, setSelectedYear] = useState('all') // 'all' | 1 | 2 | 3 | 4
  const [tableYear, setTableYear] = useState('all')       // separate filter just for table

  const load = async () => {
    setLoading(true)
    const [s, r, slip] = await Promise.all([
      apiRequest('/warden/students').catch(() => ({ students: [] })),
      apiRequest('/warden/rooms').catch(() => ({ rooms: [] })),
      apiRequest('/warden/slip/status').catch(() => ({ slipEnabled: false })),
    ])
    setStudents(s.students || [])
    setRooms(r.rooms || [])
    setSlipEnabled(slip.slipEnabled || false)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleSlip = async () => {
    setTogglingSlip(true)
    try {
      const res = await apiRequest('/warden/slip/toggle', { method: 'PUT', body: { enabled: !slipEnabled } })
      setSlipEnabled(res.slipEnabled)
      setMsg({ type: 'success', text: `Preference slip ${res.slipEnabled ? 'enabled' : 'disabled'} for Year 2+ students.` })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setTogglingSlip(false)
    }
  }

  const runAuto = async () => {
    const yearLabel = selectedYear === 'all' ? 'all years' : `Year ${selectedYear}`
    if (!confirm(`Run room allocation for ${yearLabel}?`)) return

    setRunning(true)
    setMsg(null)
    try {
      const body = selectedYear !== 'all' ? { year: selectedYear } : {}
      const res = await apiRequest('/warden/rooms/allocate/run', { method: 'POST', body })
      setMsg({ type: 'success', text: `${res.message} — ${res.allocated} allocated, ${res.waitlisted} waitlisted.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setRunning(false)
    }
  }

  const unallocateStudent = async (studentId, name) => {
    if (!confirm(`Unallocate room for ${name}?`)) return
    try {
      await apiRequest(`/warden/rooms/unallocate/${studentId}`, { method: 'POST' })
      setMsg({ type: 'success', text: `${name} unallocated.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const unallocateAll = async () => {
    if (!confirm('Unallocate ALL rooms? This cannot be undone.')) return
    try {
      await apiRequest('/warden/rooms/unallocate-all', { method: 'POST' })
      setMsg({ type: 'success', text: 'All rooms unallocated.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const manualAlloc = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/warden/rooms/allocate/manual', { method: 'POST', body: manualForm })
      setMsg({ type: 'success', text: 'Student manually allocated!' })
      setShowManual(false)
      setManualForm({ studentId: '', roomId: '' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Stats
  const pending   = students.filter(s => s.allocationStatus === 'pending')
  const allocated = students.filter(s => s.allocationStatus === 'allocated')
  const waitlisted = students.filter(s => s.allocationStatus === 'waitlist')
  const monitored  = students.filter(s => s.isMonitored)
  const availableRooms = rooms.filter(r => !r.isWardenRoom && (r.occupants?.length || 0) < r.capacity)

  // Table filtered by tableYear
  const tableStudents = tableYear === 'all'
    ? students
    : students.filter(s => s.year === Number(tableYear))

  // Pending count for selected year (for button label)
  const pendingForYear = selectedYear === 'all'
    ? pending.length
    : pending.filter(s => s.year === Number(selectedYear)).length

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header">
        <h1>Room Allocation</h1>
        <p>Allocate rooms year by year or all at once</p>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon yellow" />
          <div><div className="stat-val">{pending.length}</div><div className="stat-label">Pending</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" />
          <div><div className="stat-val">{allocated.length}</div><div className="stat-label">Allocated</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red" />
          <div><div className="stat-val">{waitlisted.length}</div><div className="stat-label">Waitlisted</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue" />
          <div><div className="stat-val">{availableRooms.length}</div><div className="stat-label">Available Rooms</div></div>
        </div>
      </div>

      {/* Slip Toggle */}
      <div className="card mb-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Preference Slip (Year 2+ only)</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text2)', margin: 0 }}>
              Year 1 students are grouped by branch automatically. Enable slip for Year 2–4 students to submit roommate preferences.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={`badge ${slipEnabled ? 'badge-present' : 'badge-absent'}`}>
              {slipEnabled ? 'Open' : 'Closed'}
            </span>
            <button
              className={`btn ${slipEnabled ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleSlip}
              disabled={togglingSlip}
            >
              {togglingSlip ? 'Updating...' : slipEnabled ? 'Disable Slip' : 'Enable Slip'}
            </button>
          </div>
        </div>
      </div>

      {/* Monitored students — manual only */}
      {monitored.length > 0 && (
        <div className="card mb-2">
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Disciplinary Students — Manual Allocation Required</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Current Room</th><th>Action</th></tr></thead>
              <tbody>
                {monitored.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                    <td>{s.admissionNumber}</td>
                    <td>{s.branch}</td>
                    <td>Yr {s.year}</td>
                    <td>{s.roomId?.roomNumber || '—'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm"
                        onClick={() => { setManualForm({ studentId: s._id, roomId: '' }); setShowManual(true) }}>
                        Assign Room
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year-wise allocation controls */}
      <div className="card mb-2">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Run Allocation</div>

        {/* Year selector */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Select Year to Allocate
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 1, 2, 3, 4].map(y => {
              const count = y === 'all'
                ? pending.length
                : pending.filter(s => s.year === y).length
              return (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: `2px solid ${selectedYear === y ? 'var(--purple2)' : 'var(--border)'}`,
                    background: selectedYear === y ? 'rgba(139,92,246,0.15)' : 'var(--card2)',
                    color: selectedYear === y ? 'var(--purple3)' : 'var(--text2)',
                    fontWeight: selectedYear === y ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {y === 'all' ? 'All Years' : `Year ${y}`}
                  {count > 0 && (
                    <span style={{
                      marginLeft: '0.5rem',
                      background: selectedYear === y ? 'var(--purple2)' : 'var(--bg3)',
                      color: selectedYear === y ? '#fff' : 'var(--text3)',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Info about selected year */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: '8px' }}>
          {selectedYear === 'all' ? (
            <span>Will allocate all pending students — Year 1 by branch, Year 2–4 by preference slip.</span>
          ) : selectedYear === 1 ? (
            <span>Year 1 students will be grouped by branch automatically. No preference slip needed.</span>
          ) : (
            <span>Year {selectedYear} students will be grouped using preference slips (FCFS). Slip must be enabled for students to have submitted preferences.</span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={runAuto}
            disabled={running || pendingForYear === 0}
          >
            {running
              ? 'Running...'
              : selectedYear === 'all'
                ? `Run Allocation — All Years (${pendingForYear} pending)`
                : `Run Allocation — Year ${selectedYear} (${pendingForYear} pending)`
            }
          </button>
          <button className="btn btn-secondary" onClick={() => setShowManual(true)}>
            Manual Override
          </button>
          <button className="btn btn-danger" onClick={unallocateAll}>
            Unallocate All Rooms
          </button>
        </div>
      </div>

      {/* Allocation table with year filter */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontWeight: 700 }}>
            Current Allocations
            <span style={{ fontWeight: 400, color: 'var(--text2)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              ({tableStudents.length} students)
            </span>
          </div>
          {/* Table year filter */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text3)', marginRight: '0.25rem' }}>Filter:</span>
            {['all', 1, 2, 3, 4].map(y => (
              <button
                key={y}
                onClick={() => setTableYear(y)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: `1px solid ${tableYear === y ? 'var(--purple2)' : 'var(--border)'}`,
                  background: tableYear === y ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: tableYear === y ? 'var(--purple3)' : 'var(--text3)',
                  fontWeight: tableYear === y ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {y === 'all' ? 'All' : `Yr ${y}`}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th>
                <th>Room</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tableStudents.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                  <td>{s.admissionNumber}</td>
                  <td>{s.branch}</td>
                  <td>Yr {s.year}</td>
                  <td>{s.roomId?.roomNumber || '—'}</td>
                  <td>
                    <span className={`badge ${
                      s.allocationStatus === 'allocated' ? 'badge-present' :
                      s.allocationStatus === 'waitlist' ? 'badge-absent' : 'badge-pending'
                    }`}>
                      {s.allocationStatus}
                    </span>
                  </td>
                  <td>
                    {s.allocationStatus === 'allocated' && (
                      <button className="btn btn-danger btn-sm"
                        onClick={() => unallocateStudent(s._id, s.fullName)}>
                        Unallocate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tableStudents.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <p>{tableYear === 'all' ? 'No students yet' : `No Year ${tableYear} students`}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual override modal */}
      {showManual && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Manual Room Assignment</h2>
              <button className="modal-close" onClick={() => setShowManual(false)}>X</button>
            </div>
            <form onSubmit={manualAlloc}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-select" value={manualForm.studentId}
                  onChange={e => setManualForm({ ...manualForm, studentId: e.target.value })} required>
                  <option value="">— Select Student —</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.admissionNumber}) — Yr {s.year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room *</label>
                <select className="form-select" value={manualForm.roomId}
                  onChange={e => setManualForm({ ...manualForm, roomId: e.target.value })} required>
                  <option value="">— Select Room —</option>
                  {availableRooms.map(r => (
                    <option key={r._id} value={r._id}>
                      Room {r.roomNumber} — Floor {r.floor} ({r.occupants?.length || 0}/{r.capacity} occupied)
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Assigning...' : 'Assign Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
