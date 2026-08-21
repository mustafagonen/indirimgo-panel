'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-badge">🏷️</div>
          <div className="login-title">indirimGO Panel</div>
          <div className="login-subtitle">Yönetim paneline giriş yapın</div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="login-email">
              E-posta Adresi
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@indirimgo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="login-password">
              Şifre
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            style={{ marginTop: 8, width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Giriş yapılıyor...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p className="text-sm text-muted">
            Sadece yetkili admin kullanıcıları giriş yapabilir
          </p>
        </div>
      </div>
    </div>
  )
}
