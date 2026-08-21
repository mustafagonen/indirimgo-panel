'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, CATEGORY_LABELS, type Discount, type DiscountCategory } from '@/lib/types'
import CustomSelect from '@/components/ui/CustomSelect'

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchDiscounts() }, [])

  const fetchDiscounts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('discounts')
      .select('*, companies(*), locations(*)')
      .order('created_at', { ascending: false })
    setDiscounts((data ?? []) as Discount[])
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('discounts').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    fetchDiscounts()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('discounts').update({ is_active: !current }).eq('id', id)
    fetchDiscounts()
  }

  const now = new Date()

  const getExpiryInfo = (validUntil: string) => {
    const date = new Date(validUntil)
    const diff = date.getTime() - now.getTime()
    if (diff < 0) return { label: 'Süresi doldu', cls: 'expired' }
    const hours = Math.floor(diff / 3600000)
    if (hours < 3) return { label: `${hours}s bitiyor`, cls: 'soon' }
    const days = Math.floor(diff / 86400000)
    return { label: `${days} gün`, cls: 'ok' }
  }

  const filtered = discounts.filter(d => {
    const matchSearch = !search ||
      (d.companies?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      (d.badge ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || d.companies?.category === categoryFilter
    const isExpired = new Date(d.valid_until) < now
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' && d.is_active && !isExpired) ||
      (statusFilter === 'inactive' && !d.is_active) ||
      (statusFilter === 'expired' && isExpired)
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">İndirimler</h1>
          <p className="page-subtitle">{discounts.length} indirim kayıtlı</p>
        </div>
        <div className="page-header-actions">
          <Link href="/discounts/new" className="btn btn-primary" id="discounts-add-btn">
            <span>+</span>
            <span>İndirim Ekle</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <span className="search-input-icon">🔍</span>
          <input
            id="discounts-search"
            type="text"
            className="search-input"
            placeholder="Firma, açıklama veya badge ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: 220 }}>
          <CustomSelect
            id="discounts-category-filter"
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Tüm Kategoriler"
            options={[
              { value: '', label: 'Tüm Kategoriler' },
              ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
                value: key,
                label: label,
                icon: CATEGORY_EMOJIS[key as DiscountCategory],
              })),
            ]}
          />
        </div>
        <div style={{ width: 190 }}>
          <CustomSelect
            id="discounts-status-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tüm Durumlar"
            options={[
              { value: '', label: 'Tüm Durumlar' },
              { value: 'active', label: 'Aktif', icon: '✅' },
              { value: 'inactive', label: 'Pasif', icon: '⏸' },
              { value: 'expired', label: 'Süresi Dolmuş', icon: '⏰' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>Açıklama</th>
              <th>İndirim</th>
              <th>Badge</th>
              <th>Bitiş</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 20, width: '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🏷️</div>
                    <div className="table-empty-text">
                      {search || categoryFilter || statusFilter
                        ? 'Filtrelere uygun indirim bulunamadı'
                        : 'Henüz indirim eklenmedi'}
                    </div>
                    <div className="table-empty-sub">
                      <Link href="/discounts/new" style={{ color: 'var(--primary)' }}>
                        İlk indirimi ekle →
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(d => {
                const expiry = getExpiryInfo(d.valid_until)
                const cat = d.companies?.category as DiscountCategory | undefined
                const isExpired = new Date(d.valid_until) < now
                return (
                  <tr key={d.id} id={`discount-row-${d.id}`} style={isExpired ? { opacity: 0.65 } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{cat ? CATEGORY_EMOJIS[cat] : '🏷️'}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                            {d.companies?.name ?? '—'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {d.locations?.city ?? '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div className="truncate" title={d.description} style={{ fontSize: 13 }}>
                        {d.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-discount">%{d.discount_percent}</span>
                    </td>
                    <td>
                      {d.badge ? (
                        <span className="badge badge-warning">{d.badge}</span>
                      ) : (
                        <span style={{ color: 'var(--text-disabled)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`expiry-badge ${expiry.cls}`}>
                        {expiry.cls === 'expired' ? '⏰' : expiry.cls === 'soon' ? '⚡' : '✅'}{' '}
                        {expiry.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`badge ${d.is_active && !isExpired ? 'badge-active' : 'badge-inactive'}`}
                        style={{ cursor: isExpired ? 'default' : 'pointer', border: 'none' }}
                        onClick={() => !isExpired && handleToggleActive(d.id, d.is_active)}
                        id={`discount-toggle-${d.id}`}
                        title={isExpired ? 'Süresi dolmuş' : d.is_active ? 'Pasife al' : 'Aktife al'}
                      >
                        {isExpired ? '⏰ Doldu' : d.is_active ? '✅ Aktif' : '⏸ Pasif'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          href={`/discounts/${d.id}/edit`}
                          className="btn btn-icon btn-sm"
                          id={`discount-edit-${d.id}`}
                          title="Düzenle"
                        >
                          ✏️
                        </Link>
                        <button
                          className="btn btn-icon btn-sm"
                          style={{ color: 'var(--accent)' }}
                          onClick={() => setDeleteId(d.id)}
                          id={`discount-delete-${d.id}`}
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-title">İndirimi Sil</div>
            <div className="modal-subtitle">
              Bu indirimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} id="discount-delete-cancel">İptal</button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                id="discount-delete-confirm"
              >
                {deleting ? <div className="spinner" /> : '🗑️'} Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
