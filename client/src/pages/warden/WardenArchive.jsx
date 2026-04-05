import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenArchive() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    apiRequest('/warden/students/archived').then(d => setStudents(d.students || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const restore = async (id, name) => {
    if (!confirm(`Restore ${name} back to active students?`)) return
    try {
      await apiRequest(`/warden/students/${id}/restore`, { method: 'POST' })
      setMsg({ type: 'success', text: `${name} restored!` })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
  }

  const filtered = students.filter(s =>
    !search || s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header"><h1>Archive</h1><p>Students who have left or graduated — restore anytime</p></div>
      <div className="section-header">
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search name or adm no..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{filtered.length} archived</span>
      </div>
      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Room</th><th>Archived On</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s._id}>
                <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                <td>{s.admissionNumber}</td><td>{s.branch}</td><td>Yr {s.year}</td>
                <td>{s.roomId?.roomNumber || '—'}</td>
                <td>{s.archivedAt ? new Date(s.archivedAt).toLocaleDateString() : '—'}</td>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.archivedReason || '—'}</td>
                <td><button className="btn btn-success btn-sm" onClick={() => restore(s._id, s.fullName)}>Restore</button></td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && <tr><td colSpan={8}><div className="empty-state"><p>No archived students</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
