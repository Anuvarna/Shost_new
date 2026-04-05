import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenReports() {
  const [filters, setFilters] = useState({ year: '', branch: '', district: '' })
  const [filterOptions, setFilterOptions] = useState({ branches: [], districts: [] })
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    apiRequest('/reports/filters').then(d => setFilterOptions(d)).catch(() => {})
  }, [])

  const generate = async () => {
    setLoading(true)
    setGenerated(false)
    try {
      const params = new URLSearchParams()
      if (filters.year) params.set('year', filters.year)
      if (filters.branch) params.set('branch', filters.branch)
      if (filters.district) params.set('district', filters.district)
      const data = await apiRequest(`/reports/students?${params}`)
      setStudents(data.students || [])
      setTotal(data.total || 0)
      setGenerated(true)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFillColor(124, 58, 237)
    doc.rect(0, 0, 297, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('HostX — Student Report', 14, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const filterText = [filters.year && `Year: ${filters.year}`, filters.branch && `Branch: ${filters.branch}`, filters.district && `District: ${filters.district}`].filter(Boolean).join('  |  ')
    doc.text(filterText || 'All Students', 14, 18)
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${total}`, 200, 18)
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Name', 'Adm No.', 'Branch', 'Year', 'Room', 'District', 'Father Phone', 'Mother Phone']],
      body: students.map((s, i) => [i + 1, s.fullName, s.admissionNumber, s.branch, s.year, s.roomId?.roomNumber || 'Unallocated', s.district || '—', s.fatherPhone || '—', s.motherPhone || '—']),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    })
    doc.save(`HostX_Report_${Date.now()}.pdf`)
  }

  return (
    <div>
      <div className="page-header"><h1>Reports</h1><p>Filter and export student data as PDF</p></div>

      <div className="card mb-2">
        <div className="card-title">Filter Options</div>
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Year</label>
            <select className="form-select" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
              <option value="">All Years</option>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Branch / Department</label>
            <select className="form-select" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
              <option value="">All Branches</option>
              {filterOptions.branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">District</label>
            <select className="form-select" value={filters.district} onChange={e => setFilters({ ...filters, district: e.target.value })}>
              <option value="">All Districts</option>
              {filterOptions.districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? 'Generating…' : '🔍 Generate Report'}</button>
          {generated && <button className="btn btn-secondary" onClick={exportPDF}>📄 Export PDF</button>}
          {generated && <span className="text-muted" style={{ fontSize: '0.875rem' }}>{total} students found</span>}
        </div>
      </div>

      {generated && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Adm No.</th><th>Branch</th><th>Year</th><th>Room</th><th>District</th><th>Father Phone</th><th>Mother Phone</th></tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td className="fw-600">{s.fullName}</td>
                  <td>{s.admissionNumber}</td>
                  <td>{s.branch}</td>
                  <td>Yr {s.year}</td>
                  <td>{s.roomId?.roomNumber || <span className="text-muted">Unallocated</span>}</td>
                  <td>{s.district || '—'}</td>
                  <td>{s.fatherPhone || '—'}</td>
                  <td>{s.motherPhone || '—'}</td>
                </tr>
              ))}
              {students.length === 0 && <tr><td colSpan={9}><div className="empty-state"><div className="icon">📋</div><p>No students match filters</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
