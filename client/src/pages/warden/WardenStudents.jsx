import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

function validate(form) {
  if (!form.fullName || !form.fullName.trim()) return 'Full name is required'
  if (/\d/.test(form.fullName)) return 'Full name cannot contain numbers'
  if (form.phone && !/^\d{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits'
  if (form.fatherPhone && !/^\d{10}$/.test(form.fatherPhone)) return 'Father phone must be exactly 10 digits'
  if (form.motherPhone && !/^\d{10}$/.test(form.motherPhone)) return 'Mother phone must be exactly 10 digits'
  return null
}

export default function WardenStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [archiveModal, setArchiveModal] = useState(null)
  const [archiveReason, setArchiveReason] = useState('')

  const load = () => {
    setLoading(true)
    apiRequest('/warden/students').then(d => setStudents(d.students || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openEdit = (s) => {
    setSelected(s)
    setMsg(null)
    setEditForm({
      fullName: s.fullName || '',
      branch: s.branch || '',
      year: s.year || 1,
      phone: s.phone || '',
      district: s.district || '',
      state: s.state || '',
      fatherName: s.fatherName || '',
      fatherPhone: s.fatherPhone || '',
      fatherEmail: s.fatherEmail || '',
      motherName: s.motherName || '',
      motherPhone: s.motherPhone || '',
      motherEmail: s.motherEmail || '',
    })
  }

  const save = async (e) => {
    e.preventDefault()
    const err = validate(editForm)
    if (err) { setMsg({ type: 'error', text: err }); return }
    setSaving(true)
    try {
      await apiRequest(`/warden/students/${selected._id}`, {
        method: 'PUT',
        body: editForm
      })
      setMsg({ type: 'success', text: 'Student updated successfully!' })
      setSelected(null)
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const archive = async () => {
    if (!archiveModal) return
    try {
      await apiRequest(`/warden/archive/${archiveModal._id}`, {
        method: 'POST',
        body: { reason: archiveReason || 'Graduated / Left hostel' }
      })
      setMsg({ type: 'success', text: `${archiveModal.fullName} archived successfully.` })
      setArchiveModal(null)
      setArchiveReason('')
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const filtered = students.filter(s =>
    !search ||
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <p>View and edit student details</p>
      </div>

      <div className="section-header">
        <input className="form-input" style={{ maxWidth: 300 }}
          placeholder="Search name or admission no..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{filtered.length} students</span>
      </div>

      {msg && !selected && !archiveModal && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Adm No.</th><th>Branch</th>
              <th>Year</th><th>Room</th><th>District</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.userId?.email}</div>
                </td>
                <td>{s.admissionNumber}</td>
                <td>{s.branch}</td>
                <td>Yr {s.year}</td>
                <td>{s.roomId?.roomNumber || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                <td>{s.district || '—'}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setArchiveModal(s); setArchiveReason('') }}>Archive</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7}><div className="empty-state"><p>No students found</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Archive confirmation modal */}
      {archiveModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>Archive Student</h2>
              <button className="modal-close" onClick={() => setArchiveModal(null)}>X</button>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: '1rem' }}>
              Archive <strong>{archiveModal.fullName}</strong>? They will be moved to the Archive
              section and can be restored later if needed.
            </p>
            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <input className="form-input" value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                placeholder="e.g. Graduated, Left hostel, Transfer..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setArchiveModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={archive}>Archive Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Edit Student — {selected.fullName}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>X</button>
            </div>
            <form onSubmit={save}>
              {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={editForm.fullName}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Letters only" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input className="form-input" value={editForm.branch}
                    onChange={e => setEditForm({ ...editForm, branch: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="form-select" value={editForm.year}
                    onChange={e => setEditForm({ ...editForm, year: e.target.value })}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                    maxLength={10} placeholder="10 digit number" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input className="form-input" value={editForm.district}
                    onChange={e => setEditForm({ ...editForm, district: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" value={editForm.state}
                    onChange={e => setEditForm({ ...editForm, state: e.target.value })} />
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>FATHER'S DETAILS</div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.fatherName}
                    onChange={e => setEditForm({ ...editForm, fatherName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" value={editForm.fatherPhone}
                    onChange={e => setEditForm({ ...editForm, fatherPhone: e.target.value.replace(/\D/g, '') })}
                    maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={editForm.fatherEmail}
                    onChange={e => setEditForm({ ...editForm, fatherEmail: e.target.value })} />
                </div>
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>MOTHER'S DETAILS</div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.motherName}
                    onChange={e => setEditForm({ ...editForm, motherName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" value={editForm.motherPhone}
                    onChange={e => setEditForm({ ...editForm, motherPhone: e.target.value.replace(/\D/g, '') })}
                    maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={editForm.motherEmail}
                    onChange={e => setEditForm({ ...editForm, motherEmail: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
