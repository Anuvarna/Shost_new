import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiRequest } from './utils/api'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import WardenDashboard from './pages/warden/WardenDashboard'
import StudentDashboard from './pages/student/StudentDashboard'

function ProtectedRoute({ user, allowedRole, children }) {
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== allowedRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    apiRequest('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a' }}>
      <div className="loader" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/admin/*" element={
          <ProtectedRoute user={user} allowedRole="admin">
            <AdminDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/warden/*" element={
          <ProtectedRoute user={user} allowedRole="warden">
            <WardenDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/student/*" element={
          <ProtectedRoute user={user} allowedRole="student">
            <StudentDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
