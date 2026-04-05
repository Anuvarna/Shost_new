import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'facility', description: '' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest('/student/complaints').then(d => setComplaints(d.complaints || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('type', form.type)
      fd.append('description', form.description)
      if (image) fd.append('image', image)
      await apiRequest('/student/complaints', { method: 'POST', body: fd, isFormData: true })
      setMsg({ type: 'success', text: 'Complaint submitted!' })
      setShowModal(false)
      setForm({ type: 'facility', description: '' })
      setImage(null)
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header"><h1>Complaints</h1><p>Submit and track your complaints</p></div>
      <div className="section-header">
        <span className="text-muted">{complaints.length} total</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Complaint</button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {complaints.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {complaints.map(c => (
            <div key={c._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{c.type}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`badge badge-${c.status === 'resolved' ? 'resolved' : c.status === 'in_progress' ? 'progress' : 'pending'}`}>{c.status}</span>
              </div>
              <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: c.wardenReply ? '0.75rem' : 0 }}>{c.description}</div>
              {c.imagePath && <a href={c.imagePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem', display: 'block', marginBottom: '0.75rem' }}>📷 View attached image</a>}
              {c.wardenReply && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '0.3rem', fontSize: '0.78rem' }}>WARDEN'S REPLY</div>
                  <div style={{ color: 'var(--text2)' }}>{c.wardenReply}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="empty-state"><div className="icon">⚠️</div><p>No complaints filed</p></div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>File a Complaint</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Complaint Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="facility">Room Facility (Fan, Light, Furniture)</option>
                  <option value="bathroom">Bathroom Issue</option>
                  <option value="common_area">Common Area</option>
                  <option value="food">Food Quality</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail…" style={{ minHeight: 100 }} required />
              </div>
              <div className="form-group">
                <label className="form-label">Attach Image (optional, max 2MB)</label>
                <input className="form-input" type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit Complaint'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
