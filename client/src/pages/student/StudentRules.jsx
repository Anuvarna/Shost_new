import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function StudentRules() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/student/rules').then(d => setContent(d.content || '')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Rules & Regulations</h1><p>Hostel rules and code of conduct</p></div>
      <div className="card" style={{ maxWidth: 800 }}>
        {content
          ? <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text2)', lineHeight: 1.8, fontSize: '0.9rem' }}>{content}</div>
          : <div className="empty-state"><div className="icon">📋</div><p>No rules published yet</p></div>
        }
      </div>
    </div>
  )
}
