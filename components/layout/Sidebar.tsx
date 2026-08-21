'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    section: 'Genel',
    items: [
      { href: '/', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    section: 'Yönetim',
    items: [
      { href: '/companies', label: 'Firmalar', icon: '🏢' },
      { href: '/locations', label: 'Lokasyonlar', icon: '📍' },
      { href: '/discounts', label: 'İndirimler', icon: '🏷️' },
    ],
  },
  {
    section: 'Sistem',
    items: [
      { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-badge">🏷️</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">indirimGO</span>
            <span className="sidebar-logo-sub">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                id={`sidebar-nav-${item.href.replace('/', '') || 'dashboard'}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--bg-surface2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 8,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: 'var(--bg-base)',
            flexShrink: 0,
          }}>
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', truncate: true }}>
              Admin
            </div>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email ?? '—'}
            </div>
          </div>
        </div>

        <button
          id="sidebar-signout"
          onClick={handleSignOut}
          className="btn btn-ghost w-full"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
        >
          <span>🚪</span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}
