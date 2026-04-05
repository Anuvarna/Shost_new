import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function BulkUpload() {
  const [hostels, setHostels] = useState([])
  const [hostelId, setHostelId] = useState('')
  const [preview, setPreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    apiRequest('/admin/hostels').then(d => setHostels(d.hostels || [])).catch(() => {})
  }, [])

  const parseFile = async (f) => {
    setPreview([])
    setResult(null)
    setMsg(null)

    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setMsg({ type: 'error', text: 'Only Excel (.xlsx, .xls) or CSV (.csv) files are supported.' })
      return
    }

    if (ext === 'csv') {
      const text = await f.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setMsg({ type: 'error', text: 'CSV is empty or has only headers.' }); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''))
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj = {}
        headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || '' })
        return mapRow(obj)
      }).filter(r => r.name || r.email)
      setPreview(rows)
    } else {
      try {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
        const data = await f.arrayBuffer()
        const wb = XLSX.read(data)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const rows = json.map(row => {
          const obj = {}
          Object.keys(row).forEach(k => { obj[k.toLowerCase().replace(/\s+/g, '')] = String(row[k] || '') })
          return mapRow(obj)
        }).filter(r => r.name || r.email)
        setPreview(rows)
        if (rows.length === 0) setMsg({ type: 'error', text: 'No valid rows found. Check your column headers match the required format.' })
      } catch (err) {
        setMsg({ type: 'error', text: 'Error reading Excel file: ' + err.message })
      }
    }
  }

  const mapRow = (obj) => ({
    name: obj['name'] || obj['fullname'] || obj['fullName'] || '',
    email: obj['email'] || '',
    admissionNumber: obj['admissionnumber'] || obj['admno'] || obj['admission_number'] || '',
    branch: obj['branch'] || obj['department'] || '',
    year: obj['year'] || '',
    phone: obj['phone'] || obj['phonenumber'] || '',
    district: obj['district'] || '',
    state: obj['state'] || '',
    fatherName: obj['fathername'] || obj['father_name'] || '',
    fatherPhone: obj['fatherphone'] || obj['father_phone'] || '',
    fatherEmail: obj['fatheremail'] || obj['father_email'] || '',
    motherName: obj['mothername'] || obj['mother_name'] || '',
    motherPhone: obj['motherphone'] || obj['mother_phone'] || '',
    motherEmail: obj['motheremail'] || obj['mother_email'] || '',
  })

  const upload = async () => {
    if (!hostelId) { setMsg({ type: 'error', text: 'Please select a hostel first.' }); return }
    if (preview.length === 0) { setMsg({ type: 'error', text: 'No student data to upload.' }); return }
    setUploading(true); setMsg(null)
    try {
      const res = await apiRequest('/admin/students/bulk', { method: 'POST', body: { students: preview, hostelId } })
      setResult(res)
      setPreview([])
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setUploading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Bulk Upload Students</h1>
        <p>Upload an Excel or CSV file to add multiple students at once</p>
      </div>

      {/* Column guide */}
      <div className="card mb-2">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Required Column Headers in your File</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {['name', 'email', 'admissionNumber', 'branch', 'year', 'phone', 'district', 'fatherName', 'fatherPhone', 'motherName', 'motherPhone'].map(col => (
            <span key={col} className="badge badge-progress" style={{ fontSize: '0.78rem', padding: '3px 10px' }}>{col}</span>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)', margin: 0 }}>
          Optional: state, fatherEmail, motherEmail. Column headers are case-insensitive and spaces are ignored.
          If email is missing, it will be auto-generated as admissionNumber@hostx.com
        </p>
      </div>

      {/* Upload form */}
      <div className="card mb-2">
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Select Hostel *</label>
            <select className="form-select" value={hostelId} onChange={e => setHostelId(e.target.value)}>
              <option value="">Select Hostel</option>
              {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Upload File (.xlsx, .xls, .csv) *</label>
            <input className="form-input" type="file" accept=".xlsx,.xls,.csv"
              onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]) }} />
          </div>
        </div>
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: '0.5rem' }}>{msg.text}</div>}
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="card mb-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700 }}>{preview.length} students ready to upload</div>
            <button className="btn btn-primary" onClick={upload} disabled={uploading}>
              {uploading ? 'Uploading...' : `Upload ${preview.length} Students`}
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Phone</th><th>District</th></tr>
              </thead>
              <tbody>
                {preview.slice(0, 15).map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontSize: '0.8rem' }}>{s.email || <span style={{ color: 'var(--text3)' }}>auto</span>}</td>
                    <td>{s.admissionNumber}</td>
                    <td>{s.branch}</td><td>{s.year}</td>
                    <td>{s.phone}</td><td>{s.district}</td>
                  </tr>
                ))}
                {preview.length > 15 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.8rem' }}>
                    ... and {preview.length - 15} more students
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div className={`alert alert-${result.failed === 0 ? 'success' : 'info'}`} style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{result.message}</div>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--red)' }}>Errors:</div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Row {e.row}: {e.error}</div>
                ))}
              </div>
            )}
          </div>

          {/* Show generated passwords */}
          {result.passwords?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                Login Credentials — Save these or email manually
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '1rem' }}>
                {process.env.EMAIL_USER ? 'Emails sent automatically.' : 'Email not configured — share these credentials manually with each student.'}
              </p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Adm No.</th><th>Temp Password</th></tr></thead>
                  <tbody>
                    {result.passwords.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{p.email}</td>
                        <td>{p.admissionNumber}</td>
                        <td>
                          <code style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple3)', padding: '2px 8px', borderRadius: 4, fontSize: '0.875rem' }}>
                            {p.tempPassword}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
