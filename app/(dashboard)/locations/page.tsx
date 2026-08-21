'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, type Location, type Company } from '@/lib/types'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [locsRes, companiesRes] = await Promise.all([
      supabase.from('locations').select('*, companies(*)').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
    ])
    setLocations((locsRes.data ?? []) as Location[])
    setCompanies(companiesRes.data ?? [])
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('locations').delete().eq('id', deleteId)
    setDeleteId(null)
    setDeleting(false)
    fetchData()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('locations').update({ is_active: !current }).eq('id', id)
    fetchData()
  }

  const cities = Array.from(new Set(locations.map(l => l.city))).sort()

  const filtered = locations.filter(l => {
    const matchSearch = !search ||
      l.address.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      (l.mall_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.companies?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCity = !cityFilter || l.city === cityFilter
    const matchCompany = !companyFilter || l.company_id === companyFilter
    return matchSearch && matchCity && matchCompany
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lokasyonlar</h1>
          <p className="page-subtitle">{locations.length} lokasyon kayıtlı</p>
        </div>
        <div className="page-header-actions">
          <Link href="/locations/new" className="btn btn-primary" id="locations-add-btn">
            <span>+</span>
            <span>Lokasyon Ekle</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <span className="search-input-icon">🔍</span>
          <input
            id="locations-search"
            type="text"
            className="search-input"
            placeholder="Adres, şehir veya AVM ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="locations-city-filter"
          className="filter-select"
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
        >
          <option value="">Tüm Şehirler</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          id="locations-company-filter"
          className="filter-select"
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
        >
          <option value="">Tüm Firmalar</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>Adres</th>
              <th>Şehir</th>
              <th>AVM / Kat</th>
              <th>Koordinatlar</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
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
                    <div className="table-empty-icon">📍</div>
                    <div className="table-empty-text">
                      {search || cityFilter || companyFilter
                        ? 'Filtrelere uygun lokasyon bulunamadı'
                        : 'Henüz lokasyon eklenmedi'}
                    </div>
                    <div className="table-empty-sub">
                      <Link href="/locations/new" style={{ color: 'var(--primary)' }}>
                        İlk lokasyonu ekle →
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(loc => (
                <tr key={loc.id} id={`location-row-${loc.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>
                        {loc.companies ? CATEGORY_EMOJIS[loc.companies.category] : '🏢'}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                        {loc.companies?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div className="truncate" title={loc.address} style={{ fontSize: 13 }}>
                      {loc.address}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-category">📌 {loc.city}</span>
                  </td>
                  <td>
                    {loc.mall_name ? (
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{loc.mall_name}</div>
                        {loc.floor && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{loc.floor}</div>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-disabled)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      <div>{loc.latitude.toFixed(4)}</div>
                      <div>{loc.longitude.toFixed(4)}</div>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`badge ${loc.is_active ? 'badge-active' : 'badge-inactive'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleActive(loc.id, loc.is_active)}
                      id={`location-toggle-${loc.id}`}
                    >
                      {loc.is_active ? '✅ Aktif' : '⏸ Pasif'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <a
                        href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-icon btn-sm"
                        title="Haritada Aç"
                        id={`location-map-${loc.id}`}
                      >
                        🗺️
                      </a>
                      <Link
                        href={`/locations/${loc.id}/edit`}
                        className="btn btn-icon btn-sm"
                        id={`location-edit-${loc.id}`}
                        title="Düzenle"
                      >
                        ✏️
                      </Link>
                      <button
                        className="btn btn-icon btn-sm"
                        style={{ color: 'var(--accent)' }}
                        onClick={() => setDeleteId(loc.id)}
                        id={`location-delete-${loc.id}`}
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
            <div className="modal-title">Lokasyonu Sil</div>
            <div className="modal-subtitle">
              Bu lokasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} id="loc-delete-cancel">İptal</button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                id="loc-delete-confirm"
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
