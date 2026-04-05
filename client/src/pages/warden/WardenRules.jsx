import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenRules() {
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    apiRequest('/warden/rules').then(d => { setContent(d.content || ''); setDraft(d.content || '') }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiRequest('/warden/rules', { method: 'PUT', body: { content: draft } })
      setContent(draft)
      setEditing(false)
      setMsg({ type: 'success', text: 'Rules updated!' })
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Rules & Regulations</h1><p>Hostel rules visible to all students</p></div>
      {msg && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="card-title" style={{ margin: 0 }}>Hostel Rules</div>
          {!editing
            ? <button className="btn btn-primary btn-sm" onClick={() => { setDraft(content); setEditing(true) }}>✏️ Edit Rules</button>
            : <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save'}</button>
              </div>
          }
        </div>

        {editing
          ? <textarea className="form-textarea" value={draft} onChange={e => setDraft(e.target.value)} style={{ minHeight: 400, fontFamily: 'inherit' }} placeholder="Enter hostel rules and regulations here…" />
          : content
            ? <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text2)', lineHeight: 1.8, fontSize: '0.9rem' }}>{content}</div>
            : <div className="empty-state"><div className="icon">📋</div><p>No rules published yet. Click Edit to add rules.</p></div>
        }
      </div>
    </div>
  )
}
