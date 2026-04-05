import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentRoom() {
  const [profile, setProfile] = useState(null)
  const [pref, setPref] = useState(null)
  const [slipEnabled, setSlipEnabled] = useState(false)
  const [year, setYear] = useState(null)
  const [prefForm, setPrefForm] = useState(['', '', ''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    const [p, pr] = await Promise.all([
      apiRequest('/student/profile').catch(() => null),
      apiRequest('/student/room-preference').catch(() => null),
    ])
    setProfile(p?.student)
    setPref(pr?.preference)
    setSlipEnabled(pr?.slipEnabled || false)
    setYear(pr?.year || p?.student?.year)
    if (pr?.preference?.preferredRoommates) {
      const adms = pr.preference.preferredRoommates.map(r => r.admissionNumber || '')
      setPrefForm([adms[0] || '', adms[1] || '', adms[2] || ''])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submitPref = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const admNos = prefForm.filter(Boolean)
      if (admNos.length === 0) { setMsg({ type: 'error', text: 'Enter at least one roommate admission number' }); setSaving(false); return }
      await apiRequest('/student/room-preference', { method: 'POST', body: { preferredRoommates: admNos } })
      setMsg({ type: 'success', text: 'Preference slip submitted successfully!' })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  const room = profile?.roomId
  const isYear1 = year === 1

  return (
    <div>
      <div className="page-header"><h1>Room Details</h1><p>Your current room and roommate preferences</p></div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">My Room</div>
          {room ? (
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--purple3)', marginBottom: '0.5rem' }}>Room {room.roomNumber}</div>
              <div style={{ color: 'var(--text2)', marginBottom: '0.25rem' }}>Floor {room.floor}</div>
              <div style={{ color: 'var(--text2)', marginBottom: '0.25rem' }}>Capacity: {room.capacity} students</div>
              <span className="badge badge-present" style={{ marginTop: '0.5rem' }}>Allocated</span>
            </div>
          ) : (
            <div>
              <div style={{ color: 'var(--text3)', marginBottom: '1rem' }}>
                {isYear1
                  ? 'Year 1 students are allocated automatically by branch. No slip required.'
                  : 'Room not allocated yet. Submit your preference slip below.'}
              </div>
              <span className="badge badge-pending">Pending Allocation</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Preference Slip Status</div>
          {isYear1 ? (
            <div>
              <span className="badge badge-progress" style={{ marginBottom: '0.75rem' }}>Not Required</span>
              <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
                Year 1 students are grouped by branch automatically. No preference slip needed.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span className={`badge ${slipEnabled ? 'badge-present' : 'badge-absent'}`}>
                  {slipEnabled ? 'Open' : 'Closed'}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>
                  {slipEnabled ? 'Slip is currently open. You can submit preferences.' : 'Slip is currently closed. Wait for warden to open it.'}
                </span>
              </div>
              {pref && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                  Last submitted: {new Date(pref.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preference form — only for Year 2+ when slip is enabled */}
      {!isYear1 && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div className="card-title">Submit / Update Preference Slip</div>
          {!slipEnabled ? (
            <div className="alert alert-info">
              The preference slip is currently closed. The warden will open it when room allocation begins.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Enter the admission numbers of your preferred roommates (up to 3). The warden will consider these during room allocation.
              </p>
              {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}
              <form onSubmit={submitPref}>
                {[0, 1, 2].map(i => (
                  <div className="form-group" key={i}>
                    <label className="form-label">Preferred Roommate {i + 1} (Admission No.)</label>
                    <input className="form-input" value={prefForm[i]} onChange={e => { const n = [...prefForm]; n[i] = e.target.value; setPrefForm(n) }} placeholder={`e.g. ADM00${i + 2}`} />
                  </div>
                ))}
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Preference Slip'}</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
