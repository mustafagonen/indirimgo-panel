'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.newPass !== password.confirm) {
      setPwError('Yeni şifreler eşleşmiyor.')
      return
    }
    if (password.newPass.length < 6) {
      setPwError('Şifre en az 6 karakter olmalı.')
      return
    }

    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)

    const { error } = await supabase.auth.updateUser({ password: password.newPass })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setPassword({ current: '', newPass: '', confirm: '' })
    }
    setPwLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ayarlar</h1>
          <p className="page-subtitle">Hesap ve sistem ayarları</p>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Account Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Hesap Bilgileri</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: 'var(--bg-base)',
            }}>
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>Admin</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div>
              <div style={{ color: 'var(--text-disabled)', fontSize: 11, marginTop: 2 }}>
                Son giriş: {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString('tr-TR')
                  : '—'}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-surface2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kullanıcı ID</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
                {user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">🔐 Şifre Değiştir</div>
          </div>

          {pwSuccess && (
            <div className="alert alert-success">✅ Şifreniz başarıyla güncellendi.</div>
          )}
          {pwError && (
            <div className="alert alert-error">⚠️ {pwError}</div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="settings-new-pass">Yeni Şifre</label>
              <input
                id="settings-new-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password.newPass}
                onChange={e => setPassword({ ...password, newPass: e.target.value })}
                required
                minLength={6}
              />
              <div className="form-hint">Minimum 6 karakter</div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="settings-confirm-pass">Yeni Şifre (Tekrar)</label>
              <input
                id="settings-confirm-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password.confirm}
                onChange={e => setPassword({ ...password, confirm: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                id="settings-change-password"
              >
                {pwLoading ? <><div className="spinner" /> Güncelleniyor...</> : <>🔐 Şifreyi Güncelle</>}
              </button>
            </div>
          </form>
        </div>

        {/* Supabase Connection */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔗 Supabase Bağlantısı</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                label: 'Supabase URL',
                value: process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co'
                  : 'Ayarlanmamış',
                ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
              },
              {
                label: 'Anon Key',
                value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? '••••••••' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-8)
                  : 'Ayarlanmamış',
                ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-surface2)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {item.value}
                  </span>
                  <span className={`badge ${item.ok ? 'badge-active' : 'badge-inactive'}`}>
                    {item.ok ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-warning" style={{ marginTop: 14, marginBottom: 0 }}>
            <span>💡</span>
            <span style={{ fontSize: 12 }}>
              Bağlantı bilgilerini değiştirmek için <code>.env.local</code> dosyasını düzenleyin ve sunucuyu yeniden başlatın.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
