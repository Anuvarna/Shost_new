// WardenLostFound.jsx
import { useEffect, useState } from 'react'
import { apiRequest } from '../../utils/api'

export default function WardenLostFound() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/warden/lostfound').then(d => setItems(d.items || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader" style={{ margin: '3rem auto' }} />

  return (
    <div>
      <div className="page-header"><h1>Lost & Found</h1><p>All reported lost and found items</p></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Title</th><th>Description</th><th>Posted By</th><th>Date</th><th>Status</th><th>Image</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td><span className={`badge badge-${item.type}`}>{item.type.toUpperCase()}</span></td>
                <td className="fw-600">{item.title}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                <td>{item.postedBy?.name || '—'}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                <td>{item.imagePath ? <a href={item.imagePath} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.8rem' }}>View</a> : '—'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="icon">🔍</div><p>No items reported</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
