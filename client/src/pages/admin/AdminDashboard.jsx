import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import AdminOverview from './AdminOverview'
import ManageHostels from './ManageHostels'
import ManageWardens from './ManageWardens'
import ManageStudents from './ManageStudents'
import AdminReports from './AdminReports'
import BulkUpload from './BulkUpload'
import AdminArchive from './AdminArchive'

const NAV = [
  { label: null, items: [{ key: 'overview', icon: '—', label: 'Overview' }] },
  { label: 'Management', items: [
    { key: 'hostels', icon: '—', label: 'Hostels' },
    { key: 'wardens', icon: '—', label: 'Wardens' },
    { key: 'students', icon: '—', label: 'Students' },
    { key: 'bulk', icon: '—', label: 'Bulk Upload' },
  ]},
  { label: 'Records', items: [
    { key: 'reports', icon: '—', label: 'Reports' },
    { key: 'archive', icon: '—', label: 'Archive' },
  ]},
]

export default function AdminDashboard({ user, setUser }) {
  const [active, setActive] = useState('overview')
  const navigate = useNavigate()

  const logout = () => { localStorage.removeItem('token'); setUser(null); navigate('/') }

  const pages = {
    overview: <AdminOverview />,
    hostels: <ManageHostels />,
    wardens: <ManageWardens />,
    students: <ManageStudents />,
    bulk: <BulkUpload />,
    reports: <AdminReports />,
    archive: <AdminArchive />,
  }

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.key === active)?.label

  return (
    <div className="dash-shell">
      <Sidebar
        logo={<>Host<span style={{ color: 'var(--purple3)' }}>X</span></>}
        subtitle="Admin Portal"
        navGroups={NAV}
        active={active}
        onSelect={setActive}
        onLogout={logout}
        userInfo={user}
      />
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left"><span className="topbar-title">{currentLabel}</span></div>
          <div className="topbar-right">
            <div className="user-chip"><span>{user.name}</span><span className="role-badge">Admin</span></div>
          </div>
        </div>
        <div className="page-content">{pages[active]}</div>
      </div>
    </div>
  )
}
