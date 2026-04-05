import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentMovement() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ destination: '', leaveDate: '', leaveTime: '', returnDate: '', returnTime: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const now = new Date()
  const hour = now.getHours()
  const canRegister = hour >= 6 && hour < 17

  const load = () => {
    setLoading(true)
    apiRequest('/student/movement').then(d => setMovements(d.movements || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await apiRequest('/student/movement', { method: 'POST', body: form })
      setMsg({ type: 'success', text: 'Movement registered successfully!' })
      setShowModal(false)
      setForm({ destination: '', leaveDate: '', leaveTime: '', returnDate: '', returnTime: '', reason: '' })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header"><h1>Movement Register</h1><p>Register when you're going home or travelling</p></div>

      {!canRegister && (
        <div className="alert alert-info mb-2">
          ⏰ Movement registration is only available between <strong>6:00 AM and 5:00 PM</strong>.
          Current time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div className="section-header">
        <span className="text-muted">{movements.length} total records</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={!canRegister}>
          + Register Movement
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {movements.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Destination</th><th>Leave Date & Time</th><th>Return Date & Time</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {movements.map(m => (
                <tr key={m._id}>
                  <td className="fw-600">{m.destination}</td>
                  <td style={{ fontSize: '0.85rem' }}>{m.leaveDate} at {m.leaveTime}</td>
                  <td style={{ fontSize: '0.85rem' }}>{m.returnDate} at {m.returnTime}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reason || '—'}</td>
                  <td><span className={`badge ${m.status === 'returned' ? 'badge-present' : 'badge-pending'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && (
        <div className="empty-state"><div className="icon">🚶</div><p>No movement records</p></div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Register Movement</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <input className="form-input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Home – Kottayam" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Leave Date *</label>
                  <input className="form-input" type="date" value={form.leaveDate} onChange={e => setForm({ ...form, leaveDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Leave Time *</label>
                  <input className="form-input" type="time" value={form.leaveTime} onChange={e => setForm({ ...form, leaveTime: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Return Date *</label>
                  <input className="form-input" type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Return Time *</label>
                  <input className="form-input" type="time" value={form.returnTime} onChange={e => setForm({ ...form, returnTime: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Festival vacation" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Registering…' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
