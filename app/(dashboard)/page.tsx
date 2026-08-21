'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, CATEGORY_LABELS, type Discount, type DiscountCategory } from '@/lib/types'

interface Stats {
  companies: number
  locations: number
  discounts: number
  activeDiscounts: number
  expiredDiscounts: number
  expiringSoon: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    companies: 0, locations: 0, discounts: 0,
    activeDiscounts: 0, expiredDiscounts: 0, expiringSoon: 0,
  })
  const [recentDiscounts, setRecentDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const now = new Date().toISOString()
    const soonThreshold = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

    const [companies, locations, discounts, activeDiscounts, expiredDiscounts, expiringSoon, recent] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('locations').select('*', { count: 'exact', head: true }),
      supabase.from('discounts').select('*', { count: 'exact', head: true }),
      supabase.from('discounts').select('*', { count: 'exact', head: true })
        .eq('is_active', true).gte('valid_until', now),
      supabase.from('discounts').select('*', { count: 'exact', head: true })
        .lt('valid_until', now),
      supabase.from('discounts').select('*', { count: 'exact', head: true })
        .eq('is_active', true).gte('valid_until', now).lte('valid_until', soonThreshold),
      supabase.from('discounts').select('*, companies(name, category)')
        .order('created_at', { ascending: false }).limit(5),
    ])

    setStats({
      companies: companies.count ?? 0,
      locations: locations.count ?? 0,
      discounts: discounts.count ?? 0,
      activeDiscounts: activeDiscounts.count ?? 0,
      expiredDiscounts: expiredDiscounts.count ?? 0,
      expiringSoon: expiringSoon.count ?? 0,
    })

    setRecentDiscounts((recent.data ?? []) as Discount[])
    setLoading(false)
  }

  const statCards = [
    {
      label: 'Toplam Firma',
      value: stats.companies,
      icon: '🏢',
      color: '#2196F3',
      link: '/companies',
    },
    {
      label: 'Toplam Lokasyon',
      value: stats.locations,
      icon: '📍',
      color: '#9C27B0',
      link: '/locations',
    },
    {
      label: 'Aktif İndirim',
      value: stats.activeDiscounts,
      icon: '✅',
      color: '#00E676',
      link: '/discounts',
    },
    {
      label: 'Süresi Dolmuş',
      value: stats.expiredDiscounts,
      icon: '⏰',
      color: '#FF2D55',
      link: '/discounts',
    },
  ]

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    if (diff < 0) return { label: 'Süresi doldu', cls: 'expired' }
    const hours = Math.floor(diff / 3600000)
    if (hours < 3) return { label: `${hours}s sonra bitiyor`, cls: 'soon' }
    const days = Math.floor(diff / 86400000)
    if (days < 1) return { label: `${hours} saat`, cls: 'ok' }
    return { label: `${days} gün`, cls: 'ok' }
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">indirimGO verilerine genel bakış</p>
        </div>
        <div className="page-header-actions">
          <Link href="/discounts/new" className="btn btn-primary" id="dashboard-add-discount">
            <span>+</span>
            <span>Yeni İndirim</span>
          </Link>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span>
            <strong>{stats.expiringSoon}</strong> indirim önümüzdeki 3 saat içinde sona erecek.{' '}
            <Link href="/discounts" style={{ color: 'var(--warning)', textDecoration: 'underline' }}>
              İndirimleri yönet
            </Link>
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        {statCards.map((card) => (
          <Link href={card.link} key={card.label} style={{ textDecoration: 'none' }}>
            <div className="stat-card" id={`stat-card-${card.label.replace(/\s+/g, '-').toLowerCase()}`}>
              <div
                className="stat-card-glow"
                style={{ background: card.color }}
              />
              <div
                className="stat-card-icon"
                style={{ background: `${card.color}20` }}
              >
                {card.icon}
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 36, width: 80, marginBottom: 6 }} />
              ) : (
                <div className="stat-card-value">{card.value.toLocaleString('tr-TR')}</div>
              )}
              <div className="stat-card-label">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Recent Discounts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Son Eklenen İndirimler</div>
              <div className="card-subtitle">En son 5 indirim kaydı</div>
            </div>
            <Link href="/discounts" className="btn btn-ghost btn-sm">
              Tümünü Gör →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 56 }} />
              ))}
            </div>
          ) : recentDiscounts.length === 0 ? (
            <div className="table-empty">
              <div className="table-empty-icon">🏷️</div>
              <div className="table-empty-text">Henüz indirim eklenmedi</div>
              <div className="table-empty-sub">İlk indirimi eklemek için butona tıklayın</div>
            </div>
          ) : (
            recentDiscounts.map((d) => {
              const expiry = formatDate(d.valid_until)
              const cat = d.companies?.category as DiscountCategory | undefined
              return (
                <div key={d.id} className="discount-list-item">
                  <div className="discount-list-emoji">
                    {cat ? CATEGORY_EMOJIS[cat] : '🏷️'}
                  </div>
                  <div className="discount-list-info">
                    <div className="discount-list-name">{d.companies?.name ?? '—'}</div>
                    <div className="discount-list-meta">
                      {cat ? CATEGORY_LABELS[cat] : '—'} •{' '}
                      <span className={`expiry-badge ${expiry.cls}`}>
                        {expiry.cls === 'expired' ? '⏰' : expiry.cls === 'soon' ? '⚡' : '✅'} {expiry.label}
                      </span>
                    </div>
                  </div>
                  <div className="badge badge-discount">%{d.discount_percent}</div>
                </div>
              )
            })
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Hızlı İşlemler</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/companies/new', label: 'Firma Ekle', icon: '🏢', color: 'var(--info)' },
                { href: '/locations/new', label: 'Lokasyon Ekle', icon: '📍', color: '#9C27B0' },
                { href: '/discounts/new', label: 'İndirim Ekle', icon: '🏷️', color: 'var(--primary)' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`quick-action-${item.href.replace(/\//g, '-').substring(1)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 14px',
                    background: 'var(--bg-surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    transition: 'all var(--transition)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = item.color
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  <span style={{
                    width: 34, height: 34,
                    background: `${item.color}20`,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-disabled)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Özet</div>
            </div>
            {[
              { label: 'Toplam İndirim', value: stats.discounts, color: 'var(--text-primary)' },
              { label: 'Aktif İndirim', value: stats.activeDiscounts, color: 'var(--primary)' },
              { label: 'Süresi Dolmuş', value: stats.expiredDiscounts, color: 'var(--accent)' },
              { label: 'Yakında Bitiyor', value: stats.expiringSoon, color: 'var(--warning)' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
