import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function ManageHostels() {
  const [hostels, setHostels] = useState([])
  const [selected, setSelected] = useState(null)
  const [hostelDetail, setHostelDetail] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', gender: 'Boys', totalFloors: '', studentsPerRoom: 3 })
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    setLoading(true)
    apiRequest('/admin/hostels').then(d => setHostels(d.hostels || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openDetail = async (hostel) => {
    setSelected(hostel)
    setDetailLoading(true)
    const data = await apiRequest(`/admin/hostels/${hostel._id}`).catch(() => null)
    setHostelDetail(data)
    setDetailLoading(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/admin/hostels', { method: 'POST', body: form })
      setMsg('Hostel created!')
      setShowModal(false)
      setForm({ name: '', description: '', gender: 'Boys', totalFloors: '', studentsPerRoom: 3 })
      load()
    } catch (err) { setMsg(err.message) }
    finally { setSaving(false) }
  }

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setHostelDetail(null) }} style={{ marginBottom: '0.75rem' }}>← Back to Hostels</button>
          <h1>{selected.name}</h1>
          <p>{selected.gender} Hostel · {selected.totalFloors} Floors · {selected.studentsPerRoom} students/room</p>
        </div>

        {detailLoading ? <div className="loader" style={{ margin: '2rem auto' }} /> : hostelDetail && (
          <>
            <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card"><div className="stat-icon purple">◎</div><div><div className="stat-val">{hostelDetail.students?.length || 0}</div><div className="stat-label">Students</div></div></div>
              <div className="stat-card"><div className="stat-icon blue">◫</div><div><div className="stat-val">{hostelDetail.archivedCount || 0}</div><div className="stat-label">Archived</div></div></div>
              <div className="stat-card"><div className="stat-icon green">▣</div><div><div className="stat-val">{hostelDetail.hostel?.wardens?.length || 0}</div><div className="stat-label">Wardens</div></div></div>
            </div>

            {hostelDetail.hostel?.description && (
              <div className="card mb-2" style={{ marginBottom: '1.25rem' }}>
                <div className="card-title">About</div>
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{hostelDetail.hostel.description}</p>
              </div>
            )}

            <div className="card">
              <div className="card-title">Students in this Hostel</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Room</th><th>District</th><th>Father Phone</th></tr></thead>
                  <tbody>
                    {hostelDetail.students?.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div className="fw-600">{s.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.userId?.email}</div>
                        </td>
                        <td>{s.admissionNumber}</td>
                        <td>{s.branch}</td>
                        <td>Yr {s.year}</td>
                        <td>{s.roomId?.roomNumber || <span className="text-muted">—</span>}</td>
                        <td>{s.district || '—'}</td>
                        <td>{s.fatherPhone || '—'}</td>
                      </tr>
                    ))}
                    {hostelDetail.students?.length === 0 && (
                      <tr><td colSpan={7}><div className="empty-state"><p>No students in this hostel</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header"><h1>Manage Hostels</h1><p>Click a hostel name to view details and students</p></div>

      <div className="section-header">
        <span className="text-muted">{hostels.length} hostels</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Hostel</button>
      </div>

      {msg && <div className="alert alert-info mb-2">{msg}</div>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Gender</th><th>Floors</th><th>Students/Room</th><th>Students</th><th>Wardens</th></tr></thead>
          <tbody>
            {hostels.map(h => (
              <tr key={h._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(h)}>
                <td><span style={{ color: 'var(--purple3)', fontWeight: 700, textDecoration: 'underline' }}>{h.name}</span></td>
                <td><span className={`badge badge-${h.gender?.toLowerCase()}`}>{h.gender}</span></td>
                <td>{h.totalFloors}</td>
                <td>{h.studentsPerRoom}</td>
                <td>{h.studentCount}</td>
                <td>{h.wardens?.length || 0}</td>
              </tr>
            ))}
            {hostels.length === 0 && !loading && (
              <tr><td colSpan={6}><div className="empty-state"><p>No hostels yet</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Hostel</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Hostel Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. St. Thomas Hostel (Boys)" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option>Boys</option><option>Girls</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Floors</label>
                  <input className="form-input" type="number" value={form.totalFloors} onChange={e => setForm({ ...form, totalFloors: e.target.value })} min="1" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Students Per Room</label>
                <input className="form-input" type="number" value={form.studentsPerRoom} onChange={e => setForm({ ...form, studentsPerRoom: e.target.value })} min="1" max="6" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Hostel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
