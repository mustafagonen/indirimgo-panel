'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  '/': { label: 'Dashboard' },
  '/companies': { label: 'Firmalar' },
  '/companies/new': { label: 'Yeni Firma', parent: '/companies' },
  '/locations': { label: 'Lokasyonlar' },
  '/locations/new': { label: 'Yeni Lokasyon', parent: '/locations' },
  '/discounts': { label: 'İndirimler' },
  '/discounts/new': { label: 'Yeni İndirim', parent: '/discounts' },
  '/settings': { label: 'Ayarlar' },
}

function getBreadcrumb(pathname: string) {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  // Handle dynamic routes like /companies/[id]/edit
  const parts = pathname.split('/')
  if (parts.length >= 3 && parts[parts.length - 1] === 'edit') {
    const base = '/' + parts[1]
    return { label: 'Düzenle', parent: base }
  }
  return { label: 'Sayfa' }
}

export default function Header() {
  const pathname = usePathname()
  const crumb = getBreadcrumb(pathname)

  return (
    <header className="app-header">
      {/* Breadcrumb */}
      <div className="header-breadcrumb">
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          indirimGO
        </Link>
        <span className="header-breadcrumb-sep">/</span>
        {crumb.parent && (
          <>
            <Link
              href={crumb.parent}
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              {breadcrumbMap[crumb.parent]?.label}
            </Link>
            <span className="header-breadcrumb-sep">/</span>
          </>
        )}
        <span className="header-breadcrumb-current">{crumb.label}</span>
      </div>

      {/* Right side */}
      <div className="header-actions">
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: '0 0 8px var(--primary)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ display: 'none' }}>Supabase Bağlı</span>
        </div>

        <div
          id="header-avatar"
          className="header-avatar"
          title="Hesap"
        >
          A
        </div>
      </div>
    </header>
  )
}
