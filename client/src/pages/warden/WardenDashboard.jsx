import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import WardenOverview from './WardenOverview'
import WardenStudents from './WardenStudents'
import WardenRooms from './WardenRooms'
import WardenAllocation from './WardenAllocation'
import WardenAttendance from './WardenAttendance'
import WardenComplaints from './WardenComplaints'
import WardenNotices from './WardenNotices'
import WardenLostFound from './WardenLostFound'
import WardenMovement from './WardenMovement'
import WardenRules from './WardenRules'
import WardenReports from './WardenReports'
import WardenArchive from './WardenArchive'

const NAV = [
  { label: null, items: [{ key: 'overview', label: 'Overview' }] },
  { label: 'Hostel', items: [
    { key: 'students', label: 'Students' },
    { key: 'rooms', label: 'Rooms' },
    { key: 'allocation', label: 'Room Allocation' },
    { key: 'attendance', label: 'Attendance' },
  ]},
  { label: 'Communication', items: [
    { key: 'complaints', label: 'Complaints' },
    { key: 'notices', label: 'Notices' },
    { key: 'lostfound', label: 'Lost & Found' },
    { key: 'movement', label: 'Movement' },
    { key: 'rules', label: 'Rules & Regulations' },
  ]},
  { label: 'Records', items: [
    { key: 'reports', label: 'Reports' },
    { key: 'archive', label: 'Archive' },
  ]},
]

export default function WardenDashboard({ user, setUser }) {
  const [active, setActive] = useState('overview')
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('token'); setUser(null); navigate('/') }

  const pages = {
    overview: <WardenOverview />,
    students: <WardenStudents />,
    rooms: <WardenRooms />,
    allocation: <WardenAllocation />,
    attendance: <WardenAttendance />,
    complaints: <WardenComplaints />,
    notices: <WardenNotices />,
    lostfound: <WardenLostFound />,
    movement: <WardenMovement />,
    rules: <WardenRules />,
    reports: <WardenReports />,
    archive: <WardenArchive />,
  }

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.key === active)?.label

  return (
    <div className="dash-shell">
      <Sidebar
        logo={<>Host<span style={{ color: 'var(--purple3)' }}>X</span></>}
        subtitle="Warden Portal"
        navGroups={NAV} active={active} onSelect={setActive} onLogout={logout} userInfo={user}
      />
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left"><span className="topbar-title">{currentLabel}</span></div>
          <div className="topbar-right"><div className="user-chip"><span>{user.name}</span><span className="role-badge">Warden</span></div></div>
        </div>
        <div className="page-content">{pages[active]}</div>
      </div>
    </div>
  )
}
