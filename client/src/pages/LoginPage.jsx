import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import './Login.css'

export default function LoginPage({ setUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: form })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      if (data.user.role === 'admin') navigate('/admin')
      else if (data.user.role === 'warden') navigate('/warden')
      else navigate('/student')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />

      <div className="login-card">
        <button className="login-back" onClick={() => navigate('/')}>← Back</button>

        <div className="login-logo">Host<span>X</span></div>
        <p className="login-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email" placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <p>Test credentials:</p>
          <p>admin@hostx.com / admin123</p>
          <p>warden@hostx.com / warden123</p>
          <p>student@hostx.com / student123</p>
        </div>
      </div>
    </div>
  )
}
