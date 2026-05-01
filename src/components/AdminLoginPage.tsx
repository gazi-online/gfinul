import React, { useState } from 'react'
import { authApi } from '../api/auth'

interface AdminLoginPageProps {
  /** Called when an admin successfully authenticates */
  onAdminAuthenticated: () => void
  /** Called when user wants to go back to the home page */
  onGoHome: () => void
}

// ── Icons ────────────────────────────────────────────────────────────────────

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ── Component ────────────────────────────────────────────────────────────────

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAdminAuthenticated, onGoHome }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your admin email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const data = await authApi.loginUser(email.trim(), password)
      if (!data?.user?.id) {
        throw new Error('Login failed. Please try again.')
      }

      const isAdmin = await authApi.checkUserRole(data.user.id)
      if (!isAdmin) {
        // Sign out immediately — non-admins must not proceed
        await authApi.logoutUser()
        setError('Access denied. This portal is restricted to administrators only.')
        return
      }

      onAdminAuthenticated()
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-root">
      {/* Animated background blobs */}
      <div className="admin-login-blob admin-login-blob--1" aria-hidden="true" />
      <div className="admin-login-blob admin-login-blob--2" aria-hidden="true" />
      <div className="admin-login-blob admin-login-blob--3" aria-hidden="true" />

      {/* Back to home button */}
      <button
        type="button"
        onClick={onGoHome}
        className="admin-login-back-btn"
        aria-label="Back to home"
      >
        <ArrowLeftIcon />
        <span>Back to Home</span>
      </button>

      {/* Card */}
      <div className="admin-login-card">
        {/* Logo / Brand */}
        <div className="admin-login-brand">
          <div className="admin-login-logo">
            <ShieldIcon />
          </div>
          <div>
            <h1 className="admin-login-title">GAZI ONLINE</h1>
            <p className="admin-login-subtitle">Admin Control Portal</p>
          </div>
        </div>

        {/* Divider */}
        <div className="admin-login-divider" />

        <h2 className="admin-login-heading">Administrator Sign In</h2>
        <p className="admin-login-description">
          Restricted access. Authorised personnel only.
        </p>

        {/* Error */}
        {error && (
          <div className="admin-login-error" role="alert">
            <span className="admin-login-error__icon">⚠</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <div className="admin-login-field">
            <label htmlFor="admin-email" className="admin-login-label">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              disabled={loading}
              placeholder="admin@gazionline.com"
              className="admin-login-input"
              required
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">Password</label>
            <div className="admin-login-password-wrap">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                disabled={loading}
                placeholder="••••••••"
                className="admin-login-input admin-login-input--password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="admin-login-eye-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-login-submit-btn"
          >
            {loading ? (
              <>
                <SpinnerIcon />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <ShieldIcon />
                <span>Access Admin Panel</span>
              </>
            )}
          </button>
        </form>

        <p className="admin-login-footer-note">
          🔒 All admin sessions are logged and monitored.
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
