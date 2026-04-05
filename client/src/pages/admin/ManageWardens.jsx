import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

const nameRegex = /^[a-zA-Z\s.'-]+$/

function validate(form) {
  if (!form.name) return 'Name is required'
  if (!nameRegex.test(form.name)) return 'Name must not contain numbers or special characters'
  if (!form.email) return 'Email is required'
  if (!form.phone) return 'Phone number is required'
  if (!/^\d{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits'
  return null
}

export default function ManageWardens() {
  const [wardens, setWardens] = useState([])
  const [hostels, setHostels] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', hostelId: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [w, h] = await Promise.all([
      apiRequest('/admin/wardens').catch(() => ({ wardens: [] })),
      apiRequest('/admin/hostels').catch(() => ({ hostels: [] })),
    ])
    setWardens(w.wardens || [])
    setHostels(h.hostels || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const err = validate(form)
    if (err) { setMsg({ type: 'error', text: err }); return }
    setSaving(true); setMsg(null)
    try {
      const res = await apiRequest('/admin/wardens', { method: 'POST', body: form })
      setMsg({ type: 'success', text: `Warden created! Temp password: ${res.tempPassword}` })
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', hostelId: '' })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this warden?')) return
    await apiRequest(`/admin/wardens/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="page-header"><h1>Manage Wardens</h1><p>Add and assign wardens to hostels</p></div>
      <div className="section-header">
        <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{wardens.length} wardens</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Warden</button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Hostel</th><th>Actions</th></tr></thead>
          <tbody>
            {wardens.map(w => (
              <tr key={w._id}>
                <td className="fw-600">{w.name}</td>
                <td>{w.email}</td>
                <td>{w.phone || <span className="text-muted">—</span>}</td>
                <td>{w.hostelId?.name || <span className="text-muted">Unassigned</span>}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => del(w._id)}>Delete</button></td>
              </tr>
            ))}
            {wardens.length === 0 && !loading && (
              <tr><td colSpan={5}><div className="empty-state"><p>No wardens yet</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Warden</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Full Name * (letters only)</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Thomas Joseph" required />
                {form.name && !nameRegex.test(form.name) && (
                  <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Name must not contain numbers or special characters</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number * (10 digits)</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  maxLength={10} placeholder="10-digit mobile number" required />
                {form.phone && !/^\d{10}$/.test(form.phone) && (
                  <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Must be exactly 10 digits</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Assign to Hostel</label>
                <select className="form-select" value={form.hostelId}
                  onChange={e => setForm({ ...form, hostelId: e.target.value })}>
                  <option value="">— Select Hostel —</option>
                  {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '1rem' }}>
                A temporary password will be auto-generated and sent to the warden's email.
              </p>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Warden'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
