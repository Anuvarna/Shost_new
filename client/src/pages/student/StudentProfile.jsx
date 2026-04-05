import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ color: value ? 'var(--text)' : 'var(--text3)', fontWeight: value ? 500 : 400 }}>{value || '—'}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{title}</div>
      <div className="form-row">{children}</div>
    </div>
  )
}

export default function StudentProfile() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/student/profile').then(d => setStudent(d.student)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />
  if (!student) return <div className="empty-state"><div className="icon">👤</div><p>Profile not found</p></div>

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Your personal details — contact your warden to update information</p>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {student.fullName?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{student.fullName}</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>{student.admissionNumber}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-progress">Yr {student.year}</span>
            <span className="badge badge-present">{student.branch}</span>
            <span className={`badge ${student.allocationStatus === 'allocated' ? 'badge-present' : 'badge-pending'}`}>{student.allocationStatus}</span>
          </div>
        </div>

        <Section title="Academic Details">
          <Field label="Admission Number" value={student.admissionNumber} />
          <Field label="Branch / Department" value={student.branch} />
          <Field label="Year" value={student.year ? `Year ${student.year}` : null} />
          <Field label="Phone" value={student.phone} />
        </Section>

        <Section title="Hostel & Room">
          <Field label="Hostel" value={student.hostelId?.name} />
          <Field label="Room Number" value={student.roomId?.roomNumber ? `Room ${student.roomId.roomNumber}` : 'Not allocated'} />
          <Field label="Floor" value={student.roomId?.floor ? `Floor ${student.roomId.floor}` : null} />
          <Field label="Allocation Status" value={student.allocationStatus} />
        </Section>

        <Section title="Address">
          <Field label="District" value={student.district} />
          <Field label="State" value={student.state} />
        </Section>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>FATHER'S DETAILS</div>
          <div className="form-row-3">
            <Field label="Name" value={student.fatherName} />
            <Field label="Phone" value={student.fatherPhone} />
            <Field label="Email" value={student.fatherEmail} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>MOTHER'S DETAILS</div>
          <div className="form-row-3">
            <Field label="Name" value={student.motherName} />
            <Field label="Phone" value={student.motherPhone} />
            <Field label="Email" value={student.motherEmail} />
          </div>
        </div>
      </div>
    </div>
  )
}
