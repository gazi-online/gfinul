import React, { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { authApi } from '../api/auth'

interface AdminLoginPageProps {
  onAdminAuthenticated: () => void
  onGoHome: () => void
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAdminAuthenticated, onGoHome }) => {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe]     = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [globalError, setGlobalError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGlobalError(null)

    // — Client-side validation —
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const data = await authApi.loginUser(email.trim(), password)
      if (!data?.user?.id) throw new Error('Login failed. Please try again.')

      const isAdmin = await authApi.checkUserRole(data.user.id)
      if (!isAdmin) {
        await authApi.logoutUser()
        setGlobalError('Access denied. This portal is restricted to administrators only.')
        return
      }

      onAdminAuthenticated()
    } catch (err: any) {
      setGlobalError(err?.message || 'Authentication failed. Check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        .admin-lp-root * {
          font-family: 'DM Sans', sans-serif;
        }

        .admin-lp-serif {
          font-family: 'Fraunces', serif;
        }

        @keyframes adm-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33%  { transform: translate(30px, -30px) rotate(120deg); }
          66%  { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes adm-slide-in {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes adm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes adm-shimmer {
          0%   { background-position: -1000px 0; }
          100% { background-position:  1000px 0; }
        }

        @keyframes adm-err-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .admin-lp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 40%, #ffedd5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
          position: relative;
          /* Override global dark-mode bg */
          background-color: #fff7ed !important;
        }

        /* bg shapes */
        .adm-lp-bg { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
        .adm-lp-shape {
          position: absolute;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          opacity: 0.4;
          animation: adm-float 20s infinite ease-in-out;
        }
        .adm-lp-shape:nth-child(1) {
          width: 300px; height: 300px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          top: 10%; left: 10%;
          animation-delay: 0s;
        }
        .adm-lp-shape:nth-child(2) {
          width: 400px; height: 400px;
          background: linear-gradient(135deg, #4ecdc4, #00a86b);
          bottom: 10%; right: 10%;
          animation-delay: -7s;
        }
        .adm-lp-shape:nth-child(3) {
          width: 250px; height: 250px;
          background: linear-gradient(135deg, #ffbe0b, #ff6b35);
          top: 50%; right: 20%;
          animation-delay: -14s;
        }

        /* card */
        .adm-lp-card {
          animation: adm-slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.03),
            0 20px 60px rgba(0,0,0,0.12),
            0 0 100px rgba(255,107,53,0.15);
          background: #ffffff;
          border-radius: 24px;
          padding: 2rem 2.5rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 768px) {
          .adm-lp-card { padding: 3rem; }
        }

        /* security badge */
        .adm-lp-badge {
          position: fixed;
          top: 1.5rem; right: 1.5rem;
          z-index: 10;
          animation: adm-fade-in 1s ease-out 0.3s backwards;
          backdrop-filter: blur(10px);
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,107,53,0.2);
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
        }

        /* back to home */
        .adm-lp-back {
          position: fixed;
          top: 1.5rem; left: 1.5rem;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.9rem;
          border-radius: 9999px;
          border: 1px solid rgba(0,0,0,0.12);
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(10px);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 200ms ease;
        }
        .adm-lp-back:hover {
          background: rgba(255,255,255,0.95);
          color: #1e293b;
          transform: translateX(-2px);
        }

        /* logo */
        .adm-lp-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px; height: 80px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 12px rgba(255,107,53,0.3));
        }

        /* gradient text */
        .adm-lp-gradient-text {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* inputs */
        .adm-lp-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #0f172a;
          outline: none;
          background: #fff;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }
        .adm-lp-input::placeholder { color: #94a3b8; }
        .adm-lp-input:focus {
          border-color: #f97316;
          transform: translateY(-2px);
          box-shadow:
            0 0 0 3px rgba(249,115,22,0.12),
            0 8px 16px rgba(0,0,0,0.08);
        }
        .adm-lp-input.adm-lp-input--error {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .adm-lp-input--pass { padding-right: 3rem; }

        /* icon wrapper inside input */
        .adm-lp-input-wrap { position: relative; }
        .adm-lp-input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }
        .adm-lp-eye-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          padding: 0.25rem;
          transition: color 150ms;
        }
        .adm-lp-eye-btn:hover { color: #475569; }

        /* error messages */
        .adm-lp-field-err {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.5rem;
          color: #dc2626;
          font-size: 0.8125rem;
          animation: adm-err-in 0.25s ease-out;
        }
        .adm-lp-global-err {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          animation: adm-err-in 0.3s ease-out;
        }

        /* submit button */
        .adm-lp-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(249,115,22,0.28);
        }
        .adm-lp-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
          transition: left 0.5s;
        }
        .adm-lp-btn:hover::before { left: 100%; }
        .adm-lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(249,115,22,0.42);
        }
        .adm-lp-btn:active:not(:disabled) { transform: translateY(0); }
        .adm-lp-btn:disabled {
          background: linear-gradient(90deg, #ff6b35 0%, #f7931e 25%, #ff6b35 50%, #f7931e 75%, #ff6b35 100%);
          background-size: 200% 100%;
          animation: adm-shimmer 2s infinite;
          cursor: not-allowed;
          opacity: 0.85;
        }

        /* checkbox */
        .adm-lp-checkbox {
          appearance: none;
          width: 20px; height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          flex-shrink: 0;
        }
        .adm-lp-checkbox:checked {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          border-color: #ff6b35;
        }
        .adm-lp-checkbox:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 13px;
          font-weight: bold;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }

        /* divider */
        .adm-lp-divider {
          position: relative;
          margin: 2rem 0;
        }
        .adm-lp-divider::before {
          content: '';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          border-top: 2px solid #e2e8f0;
          top: 50%;
        }
        .adm-lp-divider-label {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .adm-lp-divider-label span {
          background: #fff;
          padding: 0 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
        }

        /* bottom bar */
        .adm-lp-bottom {
          position: fixed;
          bottom: 1.5rem; left: 0; right: 0;
          text-align: center;
          z-index: 1;
          pointer-events: none;
        }
        .adm-lp-bottom p {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>

      {/* Animated background shapes */}
      <div className="adm-lp-bg">
        <div className="adm-lp-shape" />
        <div className="adm-lp-shape" />
        <div className="adm-lp-shape" />
      </div>

      {/* Back to home */}
      <button type="button" onClick={onGoHome} className="adm-lp-back" aria-label="Back to Home">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Home
      </button>

      {/* Secure Portal badge */}
      <div className="adm-lp-badge">
        <Shield size={15} className="text-orange-600" style={{ color: '#ea580c' }} />
        <span>Secure Portal</span>
      </div>

      {/* Login card */}
      <div className="adm-lp-card">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="adm-lp-logo" style={{ margin: '0 auto 1rem' }}>
            <Lock size={36} color="#fff" strokeWidth={2.5} />
          </div>
          <h1
            className="adm-lp-serif"
            style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.1 }}
          >
            Admin{' '}
            <span className="adm-lp-gradient-text" style={{ fontStyle: 'italic' }}>Portal</span>
          </h1>
          <p style={{ color: '#475569', fontWeight: 500, margin: 0 }}>Gazi Online Government Services</p>
        </div>

        {/* Global auth error */}
        {globalError && (
          <div className="adm-lp-global-err" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {globalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Email */}
          <div>
            <label htmlFor="adm-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <div className="adm-lp-input-wrap">
              <span className="adm-lp-input-icon"><Mail size={18} /></span>
              <input
                id="adm-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); setGlobalError(null) }}
                disabled={isLoading}
                placeholder="admin@gazi.gov.in"
                className={`adm-lp-input${errors.email ? ' adm-lp-input--error' : ''}`}
              />
            </div>
            {errors.email && (
              <div className="adm-lp-field-err">
                <AlertCircle size={14} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="adm-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div className="adm-lp-input-wrap">
              <span className="adm-lp-input-icon"><Lock size={18} /></span>
              <input
                id="adm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); setGlobalError(null) }}
                disabled={isLoading}
                placeholder="Enter your password"
                className={`adm-lp-input adm-lp-input--pass${errors.password ? ' adm-lp-input--error' : ''}`}
              />
              <button type="button" className="adm-lp-eye-btn" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="adm-lp-field-err">
                <AlertCircle size={14} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Remember me & Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="adm-lp-checkbox"
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Remember me</span>
            </label>
            <a href="#" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ea580c', textDecoration: 'none' }}
               onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading} className="adm-lp-btn">
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing In…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="adm-lp-divider">
          <div className="adm-lp-divider-label">
            <span>Secure Access Only</span>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#16a34a' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>256-bit SSL Encrypted</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            This portal is restricted to authorized government officials only.
            Unauthorized access is prohibited and monitored.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="adm-lp-bottom">
        <p>© 2026 Gazi Online • Ministry of Digital Governance</p>
      </div>

      {/* Spinner keyframe (inline) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default AdminLoginPage
