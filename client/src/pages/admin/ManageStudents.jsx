import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

const EMPTY = {
  name:'', email:'', hostelId:'', admissionNumber:'', branch:'', year:1,
  phone:'', district:'', state:'Kerala',
  fatherName:'', fatherPhone:'', fatherEmail:'',
  motherName:'', motherPhone:'', motherEmail:''
}

// No numeric values allowed in name fields
const nameRegex = /^[a-zA-Z\s.'-]+$/

function validate(form) {
  if (!form.name || !form.email || !form.hostelId || !form.admissionNumber || !form.branch || !form.year)
    return 'Please fill all required fields'
  if (!nameRegex.test(form.name)) return 'Name must not contain numbers or special characters'
  if (form.phone && !/^\d{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits'
  if (form.fatherName && !nameRegex.test(form.fatherName)) return 'Father name must not contain numbers'
  if (form.motherName && !nameRegex.test(form.motherName)) return 'Mother name must not contain numbers'
  if (form.fatherPhone && !/^\d{10}$/.test(form.fatherPhone)) return 'Father phone must be exactly 10 digits'
  if (form.motherPhone && !/^\d{10}$/.test(form.motherPhone)) return 'Mother phone must be exactly 10 digits'
  return null
}

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [hostels, setHostels] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [showPromote, setShowPromote] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkHostelId, setBulkHostelId] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Archive state
  const [archiveModal, setArchiveModal] = useState(null)
  const [archiveReason, setArchiveReason] = useState('')

  // Promote state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [promoteYear, setPromoteYear] = useState('')
  const [promoting, setPromoting] = useState(false)

  const load = async () => {
    setLoading(true)
    const [s, h] = await Promise.all([
      apiRequest('/admin/students').catch(() => ({ students: [] })),
      apiRequest('/admin/hostels').catch(() => ({ hostels: [] })),
    ])
    setStudents(s.students || [])
    setHostels(h.hostels || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const err = validate(form)
    if (err) { setMsg({ type: 'error', text: err }); return }
    setSaving(true); setMsg(null)
    try {
      const res = await apiRequest('/admin/students', { method: 'POST', body: form })
      setMsg({ type: 'success', text: `Student created! Temp password: ${res.tempPassword}` })
      setShowModal(false); setForm(EMPTY); load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  const bulkUpload = async (e) => {
    e.preventDefault()
    if (!bulkFile || !bulkHostelId) { setMsg({ type: 'error', text: 'Select a file and hostel' }); return }
    setUploading(true); setBulkResult(null)
    try {
      const fd = new FormData()
      fd.append('file', bulkFile)
      fd.append('hostelId', bulkHostelId)
      const res = await apiRequest('/admin/students/bulk', { method: 'POST', body: fd, isFormData: true })
      setBulkResult(res); load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setUploading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this student permanently? This cannot be undone.')) return
    await apiRequest(`/admin/students/${id}`, { method: 'DELETE' })
    load()
  }

  const doArchive = async () => {
    if (!archiveModal) return
    try {
      await apiRequest(`/admin/students/${archiveModal._id}/archive`, {
        method: 'POST', body: { reason: archiveReason || 'Left hostel' }
      })
      setMsg({ type: 'success', text: `${archiveModal.fullName} archived successfully.` })
      setArchiveModal(null); setArchiveReason(''); load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
  }

  // Promote
  const toggleSelect = (id) => {
    const s = new Set(selectedIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedIds(s)
  }

  const selectAllByYear = (yr) => {
    const ids = students.filter(s => s.year === Number(yr)).map(s => s._id)
    setSelectedIds(new Set(ids))
  }

  const doPromote = async () => {
    if (selectedIds.size === 0) { setMsg({ type: 'error', text: 'Select at least one student' }); return }
    if (!promoteYear) { setMsg({ type: 'error', text: 'Select the year to promote to' }); return }
    setPromoting(true)
    try {
      const res = await apiRequest('/admin/students/promote', {
        method: 'POST', body: { studentIds: Array.from(selectedIds), toYear: Number(promoteYear) }
      })
      setMsg({ type: 'success', text: res.message })
      setShowPromote(false); setSelectedIds(new Set()); setPromoteYear(''); load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setPromoting(false) }
  }

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.email?.toLowerCase().includes(search.toLowerCase())
    const matchYear = !filterYear || s.year === Number(filterYear)
    return matchSearch && matchYear
  })

  return (
    <div>
      <div className="page-header"><h1>Manage Students</h1><p>Add, promote, archive, or bulk upload students</p></div>

      <div className="section-header">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ maxWidth: 220 }} placeholder="Search name, adm no..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width: 130 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPromote(true)}>Promote Students</button>
          <button className="btn btn-secondary" onClick={() => setShowBulk(true)}>Bulk Upload</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Student</button>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Hostel</th><th>Room</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {s.photo
                      ? <img src={s.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--purple3)', flexShrink: 0 }}>{s.fullName?.[0]}</div>
                    }
                    <div>
                      <div className="fw-600">{s.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.userId?.email}</div>
                    </div>
                  </div>
                </td>
                <td>{s.admissionNumber}</td>
                <td>{s.branch}</td>
                <td>Yr {s.year}</td>
                <td>{s.hostelId?.name || '—'}</td>
                <td>{s.roomId?.roomNumber || <span className="text-muted">—</span>}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setArchiveModal(s); setArchiveReason('') }}>Archive</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(s._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7}><div className="empty-state"><p>No students found</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Archive Modal */}
      {archiveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Archive Student</h2>
              <button className="modal-close" onClick={() => setArchiveModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: '1rem' }}>
              Archive <strong>{archiveModal.fullName}</strong>? They will be moved to the Archive and can be restored later.
            </p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input className="form-input" value={archiveReason} onChange={e => setArchiveReason(e.target.value)} placeholder="e.g. Graduated, Left hostel, Transferred..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setArchiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doArchive}>Archive Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromote && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Promote Students</h2>
              <button className="modal-close" onClick={() => { setShowPromote(false); setSelectedIds(new Set()) }}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Select students to promote, then choose which year to move them to.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)', alignSelf: 'center' }}>Quick select:</span>
                {[1,2,3,4,5].map(y => (
                  <button key={y} className="btn btn-secondary btn-sm" onClick={() => selectAllByYear(y)}>
                    All Year {y}
                  </button>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedIds.size} students selected</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                  <label className="form-label" style={{ margin: 0 }}>Promote to Year:</label>
                  <select className="form-select" style={{ width: 120 }} value={promoteYear} onChange={e => setPromoteYear(e.target.value)}>
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={doPromote} disabled={promoting || selectedIds.size === 0 || !promoteYear}>
                    {promoting ? 'Promoting...' : 'Promote'}
                  </button>
                </div>
              </div>
            </div>
            <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox"
                        checked={selectedIds.size === students.length && students.length > 0}
                        onChange={() => selectedIds.size === students.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(students.map(s => s._id)))}
                      />
                    </th>
                    <th>Name</th><th>Adm No.</th><th>Branch</th><th>Current Year</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} style={{ background: selectedIds.has(s._id) ? 'rgba(139,92,246,0.08)' : undefined, cursor: 'pointer' }} onClick={() => toggleSelect(s._id)}>
                      <td><input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => toggleSelect(s._id)} onClick={e => e.stopPropagation()} /></td>
                      <td className="fw-600">{s.fullName}</td>
                      <td>{s.admissionNumber}</td>
                      <td>{s.branch}</td>
                      <td><span className="badge badge-progress">Year {s.year}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowPromote(false); setSelectedIds(new Set()) }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Bulk Upload Students</h2>
              <button className="modal-close" onClick={() => { setShowBulk(false); setBulkResult(null) }}>✕</button>
            </div>
            <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              Upload an Excel (.xlsx) or CSV (.csv) file. Required columns: <strong>Name, Admission Number, Branch, Year</strong>.
              Optional: Phone, District, State, Email, Father Name, Father Phone, Father Email, Mother Name, Mother Phone, Mother Email.
            </div>
            <form onSubmit={bulkUpload}>
              <div className="form-group">
                <label className="form-label">Select Hostel *</label>
                <select className="form-select" value={bulkHostelId} onChange={e => setBulkHostelId(e.target.value)} required>
                  <option value="">— Select Hostel —</option>
                  {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Upload File (.xlsx or .csv) *</label>
                <input className="form-input" type="file" accept=".xlsx,.xls,.csv" onChange={e => setBulkFile(e.target.files[0])} required />
              </div>
              {bulkResult && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className={`alert alert-${bulkResult.errors?.length > 0 ? 'info' : 'success'}`}>{bulkResult.message}</div>
                  {bulkResult.errors?.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--bg3)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem' }}>
                      {bulkResult.errors.map((e, i) => (
                        <div key={i} style={{ color: 'var(--red)', marginBottom: '0.3rem' }}>Row {e.row}: {e.error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowBulk(false); setBulkResult(null) }}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload & Create Students'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Add New Student</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name * (letters only)</label>
                  <input className="form-input" name="name" value={form.name} onChange={f}
                    placeholder="e.g. John Thomas" required />
                  {form.name && !nameRegex.test(form.name) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Name must not contain numbers</div>}
                </div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" name="email" type="email" value={form.email} onChange={f} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Admission Number *</label><input className="form-input" name="admissionNumber" value={form.admissionNumber} onChange={f} required /></div>
                <div className="form-group"><label className="form-label">Hostel *</label>
                  <select className="form-select" name="hostelId" value={form.hostelId} onChange={f} required>
                    <option value="">— Select —</option>
                    {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Branch *</label><input className="form-input" name="branch" value={form.branch} onChange={f} placeholder="e.g. Computer Science" required /></div>
                <div className="form-group"><label className="form-label">Year *</label>
                  <select className="form-select" name="year" value={form.year} onChange={f}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={f} maxLength={10} placeholder="10-digit number" />
                  {form.phone && !/^\d{10}$/.test(form.phone) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Must be exactly 10 digits</div>}
                </div>
                <div className="form-group"><label className="form-label">District</label><input className="form-input" name="district" value={form.district} onChange={f} /></div>
              </div>
              <div className="form-group"><label className="form-label">State</label><input className="form-input" name="state" value={form.state} onChange={f} /></div>
              <div className="divider" />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '0.75rem' }}>FATHER'S DETAILS</div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Name (letters only)</label>
                  <input className="form-input" name="fatherName" value={form.fatherName} onChange={f} />
                  {form.fatherName && !nameRegex.test(form.fatherName) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>No numbers allowed</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" name="fatherPhone" value={form.fatherPhone} onChange={f} maxLength={10} />
                  {form.fatherPhone && !/^\d{10}$/.test(form.fatherPhone) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Must be 10 digits</div>}
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" name="fatherEmail" value={form.fatherEmail} onChange={f} /></div>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '0.75rem' }}>MOTHER'S DETAILS</div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Name (letters only)</label>
                  <input className="form-input" name="motherName" value={form.motherName} onChange={f} />
                  {form.motherName && !nameRegex.test(form.motherName) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>No numbers allowed</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (10 digits)</label>
                  <input className="form-input" name="motherPhone" value={form.motherPhone} onChange={f} maxLength={10} />
                  {form.motherPhone && !/^\d{10}$/.test(form.motherPhone) && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Must be 10 digits</div>}
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" name="motherEmail" value={form.motherEmail} onChange={f} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
