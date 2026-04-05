import { useState } from 'react'
import ChangePasswordModal from './ChangePasswordModal'

export default function Sidebar({ logo, subtitle, navGroups, active, onSelect, onLogout, userInfo }) {
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">{logo}</div>
        <div className="sidebar-sub">{subtitle}</div>
      </div>
      <nav className="sidebar-nav">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && <div className="sidebar-group-label">{group.label}</div>}
            {group.items.map(item => (
              <button
                key={item.key}
                className={`nav-btn${active === item.key ? ' active' : ''}`}
                onClick={() => onSelect(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {userInfo && (
          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>{userInfo.name}</div>
            <div style={{ color: 'var(--text3)', marginTop: '2px', fontSize: '0.75rem' }}>{userInfo.email}</div>
          </div>
        )}
        <button className="nav-btn" onClick={() => setShowChangePassword(true)} style={{ color: 'var(--text2)' }}>
          Change Password
        </button>
        <button className="nav-btn" onClick={onLogout} style={{ color: 'var(--red)' }}>
          Sign Out
        </button>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </aside>
  )
}
