import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StudentOverview from './StudentOverview'
import StudentProfile from './StudentProfile'
import StudentRoom from './StudentRoom'
import StudentNotices from './StudentNotices'
import StudentRules from './StudentRules'
import StudentComplaints from './StudentComplaints'
import StudentLostFound from './StudentLostFound'
import StudentMovement from './StudentMovement'
import StudentAttendance from './StudentAttendance'

const NAV = [
  { label: null, items: [{ key: 'overview', label: 'Overview' }] },
  { label: 'My Hostel', items: [
    { key: 'profile', label: 'My Profile' },
    { key: 'room', label: 'Room Details' },
    { key: 'attendance', label: 'My Attendance' },
    { key: 'notices', label: 'Notices' },
    { key: 'rules', label: 'Rules & Regulations' },
  ]},
  { label: 'Services', items: [
    { key: 'complaints', label: 'Complaints' },
    { key: 'lostfound', label: 'Lost & Found' },
    { key: 'movement', label: 'Movement Register' },
  ]},
]

export default function StudentDashboard({ user, setUser }) {
  const [active, setActive] = useState('overview')
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('token'); setUser(null); navigate('/') }

  const pages = {
    overview: <StudentOverview setActive={setActive} />,
    profile: <StudentProfile />,
    room: <StudentRoom />,
    attendance: <StudentAttendance />,
    notices: <StudentNotices />,
    rules: <StudentRules />,
    complaints: <StudentComplaints />,
    lostfound: <StudentLostFound />,
    movement: <StudentMovement />,
  }

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.key === active)?.label

  return (
    <div className="dash-shell">
      <Sidebar
        logo={<>Host<span style={{ color: 'var(--purple3)' }}>X</span></>}
        subtitle="Student Portal"
        navGroups={NAV} active={active} onSelect={setActive} onLogout={logout} userInfo={user}
      />
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left"><span className="topbar-title">{currentLabel}</span></div>
          <div className="topbar-right"><div className="user-chip"><span>{user.name}</span><span className="role-badge">Student</span></div></div>
        </div>
        <div className="page-content">{pages[active]}</div>
      </div>
    </div>
  )
}
