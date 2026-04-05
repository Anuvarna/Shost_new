// WardenComplaints.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export function WardenComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [replyForm, setReplyForm] = useState({ status: 'pending', wardenReply: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest('/warden/complaints').then(d => setComplaints(d.complaints || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openReply = (c) => {
    setSelected(c)
    setReplyForm({ status: c.status, wardenReply: c.wardenReply || '' })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest(`/warden/complaints/${selected._id}`, { method: 'PUT', body: replyForm })
      setMsg({ type: 'success', text: 'Complaint updated!' })
      setSelected(null)
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header"><h1>Complaints</h1><p>View and respond to student complaints</p></div>
      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Type</th><th>Description</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c._id}>
                <td>
                  <div className="fw-600">{c.studentId?.userId?.name || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{c.studentId?.admissionNumber}</div>
                </td>
                <td>{c.type}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td><span className={`badge badge-${c.status === 'resolved' ? 'resolved' : c.status === 'in_progress' ? 'progress' : 'pending'}`}>{c.status}</span></td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => openReply(c)}>Reply</button></td>
              </tr>
            ))}
            {complaints.length === 0 && !loading && <tr><td colSpan={6}><div className="empty-state"><div className="icon">⚠️</div><p>No complaints</p></div></td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Respond to Complaint</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div className="fw-600 mb-1">{selected.type}</div>
              <div style={{ color: 'var(--text2)' }}>{selected.description}</div>
              {selected.imagePath && <a href={selected.imagePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>View attached image</a>}
            </div>
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={replyForm.status} onChange={e => setReplyForm({ ...replyForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reply to Student</label>
                <textarea className="form-textarea" value={replyForm.wardenReply} onChange={e => setReplyForm({ ...replyForm, wardenReply: e.target.value })} placeholder="Write your response…" style={{ minHeight: 100 }} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Response'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WardenComplaints
