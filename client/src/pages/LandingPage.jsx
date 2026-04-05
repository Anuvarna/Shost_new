import { useNavigate } from 'react-router-dom'
import './Landing.css'

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="landing">
      <div className="landing-orb orb1" />
      <div className="landing-orb orb2" />
      <div className="landing-orb orb3" />

      <header className="landing-nav">
        <div className="landing-logo">Host<span>X</span></div>
      </header>

      <section className="landing-hero">
        <div className="hero-icon">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
            <rect x="20" y="30" width="40" height="36" rx="3" stroke="#a78bfa" strokeWidth="2.5" fill="none"/>
            <rect x="28" y="38" width="9" height="9" rx="1.5" fill="#a78bfa" opacity="0.7"/>
            <rect x="43" y="38" width="9" height="9" rx="1.5" fill="#a78bfa" opacity="0.7"/>
            <rect x="28" y="53" width="9" height="8" rx="1.5" fill="#a78bfa" opacity="0.5"/>
            <rect x="43" y="53" width="9" height="8" rx="1.5" fill="#a78bfa" opacity="0.5"/>
            <rect x="24" y="22" width="32" height="10" rx="2" stroke="#a78bfa" strokeWidth="2" fill="none"/>
            <rect x="32" y="14" width="16" height="10" rx="2" stroke="#a78bfa" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <h1 className="hero-title">Host<span>X</span></h1>
        <p className="hero-tagline">Smart Hostel Management System</p>
        <p className="hero-desc">
          Complete hostel management for engineering colleges — room allocation, attendance,
          complaints, notices, movement tracking and more.
        </p>
        <button className="hero-cta" onClick={() => navigate('/login')}>
          Get Started <span>→</span>
        </button>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>Smart Allocation</h3>
          <p>Automated room assignments.
            This feature makes room allocation faster, organized, and more reliable.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Safety First</h3>
          <p>Daily attendance tracking.
            Feature ensures the safety and security of all students in the hostel by maintaining a regular record of their presence</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Updates</h3>
          <p>Scheduled notices, complaint resolution, and lost & found system in real time.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Detailed Reports</h3>
          <p>Filter and export student reports  as PDF.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Host<span className="text-purple">X</span></span>
        <span className="text-muted">© 2026 HostX. All rights reserved.</span>
      </footer>
    </div>
  )
}
