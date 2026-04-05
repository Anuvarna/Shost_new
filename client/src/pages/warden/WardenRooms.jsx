import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ roomNumber: '', floor: '', capacity: 3, isWardenRoom: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest('/warden/rooms').then(d => setRooms(d.rooms || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.roomNumber.trim()) { setMsg({ type: 'error', text: 'Room number is required' }); return }
    if (!form.floor && form.floor !== 0) { setMsg({ type: 'error', text: 'Floor is required' }); return }
    setSaving(true)
    try {
      await apiRequest('/warden/rooms', { method: 'POST', body: form })
      setMsg({ type: 'success', text: `Room ${form.roomNumber} added successfully!` })
      setShowModal(false)
      setForm({ roomNumber: '', floor: '', capacity: 3, isWardenRoom: false })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const deleteRoom = async (room) => {
    const occ = room.occupants?.length || 0
    if (occ > 0) {
      setMsg({ type: 'error', text: `Cannot delete Room ${room.roomNumber} — ${occ} student(s) allocated here. Unallocate them first.` })
      return
    }
    if (!confirm(`Delete Room ${room.roomNumber}? This cannot be undone.`)) return
    try {
      await apiRequest(`/warden/rooms/${room._id}`, { method: 'DELETE' })
      setMsg({ type: 'success', text: `Room ${room.roomNumber} deleted.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  // Sort rooms: by floor (asc), then by room number (numeric if possible)
  const sortedRooms = [...rooms].sort((a, b) => {
    if (Number(a.floor) !== Number(b.floor)) return Number(a.floor) - Number(b.floor)
    // Try numeric sort on room number, fall back to string
    const numA = parseInt(a.roomNumber)
    const numB = parseInt(b.roomNumber)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return String(a.roomNumber).localeCompare(String(b.roomNumber))
  })

  // Group by floor
  const floorGroups = {}
  sortedRooms.forEach(r => {
    const fl = r.floor ?? 0
    if (!floorGroups[fl]) floorGroups[fl] = []
    floorGroups[fl].push(r)
  })
  const floors = Object.keys(floorGroups).sort((a, b) => Number(a) - Number(b))

  const totalStudentRooms = rooms.filter(r => !r.isWardenRoom).length
  const totalWardenRooms  = rooms.filter(r => r.isWardenRoom).length
  const totalOccupied     = rooms.reduce((a, r) => a + (r.occupants?.length || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>Room Details</h1>
        <p>Rooms are displayed floor-wise in order</p>
      </div>

      <div className="section-header">
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text2)' }}>
          <span>{totalStudentRooms} student rooms</span>
          <span>{totalWardenRooms} warden rooms</span>
          <span>{totalOccupied} occupied beds</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Room</button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {loading ? (
        <div className="loader" style={{ margin: '3rem auto' }} />
      ) : rooms.length === 0 ? (
        <div className="empty-state"><p>No rooms added yet</p></div>
      ) : (
        floors.map(floor => (
          <div key={floor} style={{ marginBottom: '1.5rem' }}>
            {/* Floor header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '0.75rem', paddingBottom: '0.5rem',
              borderBottom: '2px solid var(--border)'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--purple3)', fontSize: '0.95rem' }}>
                {Number(floor) === 0 ? 'Ground Floor' : `Floor ${floor}`}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                {floorGroups[floor].length} rooms &nbsp;·&nbsp;
                {floorGroups[floor].reduce((a, r) => a + (r.occupants?.length || 0), 0)} occupied
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room No.</th><th>Type</th><th>Capacity</th>
                    <th>Occupants</th><th>Status</th><th>Students</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {floorGroups[floor].map(r => {
                    const occ = r.occupants?.length || 0
                    const isFull = occ >= r.capacity
                    return (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 600 }}>Room {r.roomNumber}</td>
                        <td>
                          {r.isWardenRoom
                            ? <span className="badge badge-progress">Warden</span>
                            : <span className="badge badge-present">Student</span>
                          }
                        </td>
                        <td>{r.capacity}</td>
                        <td>{occ}/{r.capacity}</td>
                        <td>
                          <span className={`badge ${isFull ? 'badge-absent' : occ > 0 ? 'badge-pending' : 'badge-present'}`}>
                            {isFull ? 'Full' : occ > 0 ? 'Partial' : 'Empty'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.occupants?.map(o => o.fullName).join(', ') || '—'}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRoom(r)}
                            title={occ > 0 ? 'Unallocate students first' : 'Delete room'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Room</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={submit}>
              {msg?.type === 'error' && <div className="alert alert-error mb-2">{msg.text}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number *</label>
                  <input
                    className="form-input"
                    value={form.roomNumber}
                    onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                    placeholder="e.g. 101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Floor *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.floor}
                    onChange={e => setForm({ ...form, floor: e.target.value })}
                    placeholder="0 = Ground floor"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: e.target.value })}
                    min="1" max="10"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text2)' }}>
                    <input
                      type="checkbox"
                      checked={form.isWardenRoom}
                      onChange={e => setForm({ ...form, isWardenRoom: e.target.checked })}
                    />
                    Warden Room
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}