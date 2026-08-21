'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, CATEGORY_LABELS, type Company, type DiscountCategory } from '@/lib/types'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchCompanies() }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
    setCompanies(data ?? [])
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('companies').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    fetchCompanies()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('companies').update({ is_active: !current }).eq('id', id)
    fetchCompanies()
  }

  const filtered = companies.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || c.category === categoryFilter
    const matchActive = !activeFilter ||
      (activeFilter === 'active' ? c.is_active : !c.is_active)
    return matchSearch && matchCat && matchActive
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Firmalar</h1>
          <p className="page-subtitle">
            {companies.length} firma kayıtlı
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/companies/new" className="btn btn-primary" id="companies-add-btn">
            <span>+</span>
            <span>Firma Ekle</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <span className="search-input-icon">🔍</span>
          <input
            id="companies-search"
            type="text"
            className="search-input"
            placeholder="Firma adı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="companies-category-filter"
          className="filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">Tüm Kategoriler</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{CATEGORY_EMOJIS[key as DiscountCategory]} {label}</option>
          ))}
        </select>
        <select
          id="companies-active-filter"
          className="filter-select"
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>Kategori</th>
              <th>Telefon</th>
              <th>Web Sitesi</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: 20, width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🏢</div>
                    <div className="table-empty-text">
                      {search || categoryFilter || activeFilter
                        ? 'Filtrelere uygun firma bulunamadı'
                        : 'Henüz firma eklenmedi'}
                    </div>
                    <div className="table-empty-sub">
                      <Link href="/companies/new" style={{ color: 'var(--primary)' }}>
                        İlk firmayı ekle →
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(company => (
                <tr key={company.id} id={`company-row-${company.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="company-logo" style={{ width: 38, height: 38, fontSize: 18 }}>
                        {company.logo_url ? (
                          <Image src={company.logo_url} alt={company.name} width={38} height={38} />
                        ) : (
                          CATEGORY_EMOJIS[company.category]
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>
                          {company.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                          {new Date(company.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-category">
                      {CATEGORY_EMOJIS[company.category]} {CATEGORY_LABELS[company.category]}
                    </span>
                  </td>
                  <td>{company.phone ?? <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                  <td>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--info)', fontSize: 12 }}>
                        {company.website.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    ) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                  </td>
                  <td>
                    <button
                      className={`badge ${company.is_active ? 'badge-active' : 'badge-inactive'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleActive(company.id, company.is_active)}
                      id={`company-toggle-${company.id}`}
                      title={company.is_active ? 'Pasife al' : 'Aktife al'}
                    >
                      {company.is_active ? '✅ Aktif' : '⏸ Pasif'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/companies/${company.id}/edit`}
                        className="btn btn-icon btn-sm"
                        id={`company-edit-${company.id}`}
                        title="Düzenle"
                      >
                        ✏️
                      </Link>
                      <button
                        className="btn btn-icon btn-sm"
                        style={{ color: 'var(--accent)' }}
                        onClick={() => setDeleteId(company.id)}
                        id={`company-delete-${company.id}`}
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Firmayı Sil</div>
            <div className="modal-subtitle">
              Bu firmayı silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve firmaya bağlı tüm lokasyon ve indirimler de etkilenebilir.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} id="delete-cancel">
                İptal
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                id="delete-confirm"
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
