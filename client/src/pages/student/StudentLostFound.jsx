import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentLostFound() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'lost', title: '', description: '' })
  const [image, setImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest('/student/lostfound').then(d => setItems(d.items || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('type', form.type)
      fd.append('title', form.title)
      fd.append('description', form.description)
      if (image) fd.append('image', image)
      await apiRequest('/student/lostfound', { method: 'POST', body: fd, isFormData: true })
      setMsg({ type: 'success', text: 'Item posted successfully!' })
      setShowModal(false)
      setForm({ type: 'lost', title: '', description: '' })
      setImage(null)
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    await apiRequest(`/student/lostfound/${id}/status`, { method: 'PATCH', body: { status } })
    load()
  }

  const lost = items.filter(i => i.type === 'lost')
  const found = items.filter(i => i.type === 'found')

  return (
    <div>
      <div className="page-header"><h1>Lost & Found</h1><p>Report lost items or post found items</p></div>
      <div className="section-header">
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <span className="text-red">🔴 {lost.length} Lost</span>
          <span className="text-green">🟢 {found.length} Found</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Report Item</button>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Title</th><th>Description</th><th>Posted By</th><th>Date</th><th>Status</th><th>Image</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td><span className={`badge badge-${item.type}`}>{item.type.toUpperCase()}</span></td>
                <td className="fw-600">{item.title}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                <td>{item.postedBy?.name || '—'}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                <td>{item.imagePath ? <a href={item.imagePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem' }}>View</a> : '—'}</td>
                <td>
                  {item.status === 'open' && (
                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(item._id, 'claimed')}>Mark Claimed</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={8}><div className="empty-state"><div className="icon">🔍</div><p>No items posted yet</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Report Lost / Found Item</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="lost">Lost Item</option>
                  <option value="found">Found Item</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Item Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Blue backpack, ID card" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the item — color, brand, where lost/found…" required />
              </div>
              <div className="form-group">
                <label className="form-label">Photo (optional)</label>
                <input className="form-input" type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Posting…' : 'Post Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
