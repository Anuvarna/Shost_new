import { useState } from 'react'
import { apiRequest } from '../utils/api'

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword)
      return setMsg({ type: 'error', text: 'All fields are required' })
    if (form.newPassword.length < 6)
      return setMsg({ type: 'error', text: 'New password must be at least 6 characters' })
    if (form.newPassword !== form.confirmPassword)
      return setMsg({ type: 'error', text: 'New passwords do not match' })
    setLoading(true)
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { oldPassword: form.oldPassword, newPassword: form.newPassword }
      })
      setMsg({ type: 'success', text: 'Password changed successfully!' })
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <input className="form-input" type="password" placeholder="Enter your current password"
              value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input className="form-input" type="password" placeholder="At least 6 characters"
              value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <input className="form-input" type="password" placeholder="Repeat new password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
