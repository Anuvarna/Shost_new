import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', publishAt: '', takedownAt: '' })
  const [image, setImage] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest('/warden/notices').then(d => setNotices(d.notices || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)
      if (pdf) fd.append('pdf', pdf)
      await apiRequest('/warden/notices', { method: 'POST', body: fd, isFormData: true })
      setMsg({ type: 'success', text: 'Notice posted!' })
      setShowModal(false)
      setForm({ title: '', description: '', publishAt: '', takedownAt: '' })
      setImage(null); setPdf(null)
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this notice?')) return
    await apiRequest(`/warden/notices/${id}`, { method: 'DELETE' })
    load()
  }

  const now = new Date()
  const active = notices.filter(n => new Date(n.publishAt) <= now && new Date(n.takedownAt) >= now)
  const scheduled = notices.filter(n => new Date(n.publishAt) > now)
  const expired = notices.filter(n => new Date(n.takedownAt) < now)

  return (
    <div>
      <div className="page-header"><h1>Notices</h1><p>Post and schedule hostel announcements</p></div>
      <div className="section-header">
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <span className="text-green">● {active.length} Active</span>
          <span className="text-yellow">● {scheduled.length} Scheduled</span>
          <span className="text-muted">● {expired.length} Expired</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Notice</button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {[{ label: 'Active', items: active, color: 'var(--green)' }, { label: 'Scheduled', items: scheduled, color: 'var(--yellow)' }, { label: 'Expired', items: expired, color: 'var(--text3)' }].map(group => (
        group.items.length > 0 && (
          <div key={group.label} style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, color: group.color, marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {group.label} ({group.items.length})
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Description</th><th>Publish</th><th>Takedown</th><th>Attachments</th><th>Actions</th></tr></thead>
                <tbody>
                  {group.items.map(n => (
                    <tr key={n._id} style={{ opacity: group.label === 'Expired' ? 0.6 : 1 }}>
                      <td className="fw-600">{n.title}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</td>
                      <td>{new Date(n.publishAt).toLocaleDateString()} {new Date(n.publishAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{new Date(n.takedownAt).toLocaleDateString()} {new Date(n.takedownAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        {n.imagePath && <a href={n.imagePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem', marginRight: '0.5rem' }}>📷 Image</a>}
                        {n.pdfPath && <a href={n.pdfPath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem' }}>📄 PDF</a>}
                        {!n.imagePath && !n.pdfPath && <span className="text-muted">—</span>}
                      </td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => del(n._id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}

      {notices.length === 0 && !loading && <div className="empty-state"><div className="icon">📢</div><p>No notices yet</p></div>}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Post New Notice</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Publish At *</label><input className="form-input" type="datetime-local" value={form.publishAt} onChange={e => setForm({ ...form, publishAt: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Take Down At *</label><input className="form-input" type="datetime-local" value={form.takedownAt} onChange={e => setForm({ ...form, takedownAt: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Upload Image (optional)</label><input className="form-input" type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} /></div>
              <div className="form-group"><label className="form-label">Upload PDF (optional)</label><input className="form-input" type="file" accept="application/pdf" onChange={e => setPdf(e.target.files[0])} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Posting…' : 'Post Notice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
