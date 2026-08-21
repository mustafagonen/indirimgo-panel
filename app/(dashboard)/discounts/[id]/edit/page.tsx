'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BADGE_OPTIONS, CATEGORY_EMOJIS, type Company, type Location } from '@/lib/types'
import CustomSelect from '@/components/ui/CustomSelect'

export default function EditDiscountPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [companies, setCompanies] = useState<Company[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])

  const [form, setForm] = useState({
    company_id: '',
    location_id: '',
    description: '',
    discount_percent: 20,
    original_price: '',
    discounted_price: '',
    badge: '',
    valid_until: '',
    is_active: true,
  })

  const [fetchLoading, setFetchLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('locations').select('*').order('city'),
      supabase.from('discounts').select('*').eq('id', id).single(),
    ]).then(([companiesRes, locsRes, discountRes]) => {
      setCompanies(companiesRes.data ?? [])
      setLocations(locsRes.data ?? [])
      if (discountRes.data) {
        const d = discountRes.data
        setForm({
          company_id: d.company_id,
          location_id: d.location_id,
          description: d.description,
          discount_percent: d.discount_percent,
          original_price: d.original_price?.toString() ?? '',
          discounted_price: d.discounted_price?.toString() ?? '',
          badge: d.badge ?? '',
          valid_until: d.valid_until ? new Date(d.valid_until).toISOString().slice(0, 16) : '',
          is_active: d.is_active,
        })
      }
      setFetchLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (form.company_id) {
      setFilteredLocations(locations.filter(l => l.company_id === form.company_id))
    } else {
      setFilteredLocations(locations)
    }
  }, [form.company_id, locations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateErr } = await supabase.from('discounts').update({
      company_id: form.company_id,
      location_id: form.location_id,
      description: form.description.trim(),
      discount_percent: form.discount_percent,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
      badge: form.badge || null,
      valid_until: new Date(form.valid_until).toISOString(),
      is_active: form.is_active,
    }).eq('id', id)

    if (updateErr) {
      setError(`Güncelleme hatası: ${updateErr.message}`)
      setLoading(false)
    } else {
      router.push('/discounts')
    }
  }

  if (fetchLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <span>İndirim bilgileri yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">İndirim Düzenle</h1>
          <p className="page-subtitle">%{form.discount_percent} indirim</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 750 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">Firma & Lokasyon</div></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="edit-disc-company">Firma</label>
              <CustomSelect
                id="edit-disc-company"
                value={form.company_id}
                onChange={val => setForm({ ...form, company_id: val })}
                searchable
                options={companies.map(c => ({
                  value: c.id,
                  label: c.name,
                  icon: CATEGORY_EMOJIS[c.category],
                }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="edit-disc-location">Lokasyon</label>
              <CustomSelect
                id="edit-disc-location"
                value={form.location_id}
                onChange={val => setForm({ ...form, location_id: val })}
                searchable
                options={filteredLocations.map(l => ({
                  value: l.id,
                  label: `${l.city} — ${l.address.slice(0, 30)}${l.address.length > 30 ? '...' : ''}`,
                  sublabel: l.mall_name ? `${l.mall_name} ${l.floor ? '• ' + l.floor : ''}` : l.address,
                  icon: '📍',
                }))}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">İndirim Detayları</div></div>

          <div className="form-group">
            <label className="form-label form-label-required">İndirim Oranı</label>
            <div className="range-wrapper">
              <input
                id="edit-disc-percent"
                type="range"
                className="form-range"
                min={1} max={100}
                value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: parseInt(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${form.discount_percent}%, var(--bg-surface3) ${form.discount_percent}%, var(--bg-surface3) 100%)`
                }}
              />
              <div className="range-value">%{form.discount_percent}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="edit-disc-desc">Açıklama</label>
            <textarea id="edit-disc-desc" className="form-textarea"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-disc-orig">Orijinal Fiyat (₺)</label>
              <input id="edit-disc-orig" type="number" className="form-input"
                step="0.01" min={0} value={form.original_price}
                onChange={e => setForm({ ...form, original_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-disc-discounted">İndirimli Fiyat (₺)</label>
              <input id="edit-disc-discounted" type="number" className="form-input"
                step="0.01" min={0} value={form.discounted_price}
                onChange={e => setForm({ ...form, discounted_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-disc-badge">Badge</label>
              <CustomSelect
                id="edit-disc-badge"
                value={form.badge}
                onChange={val => setForm({ ...form, badge: val })}
                placeholder="Badge yok"
                options={[
                  { value: '', label: 'Badge yok' },
                  ...BADGE_OPTIONS.map(b => ({ value: b, label: b, icon: '🔥' })),
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="edit-disc-until">Bitiş Tarihi</label>
              <input id="edit-disc-until" type="datetime-local" className="form-input"
                value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-wrapper">
              <label className="toggle">
                <input id="edit-disc-active" type="checkbox" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">{form.is_active ? '✅ Aktif' : '⏸ Pasif'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/discounts')} id="edit-disc-cancel">
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} id="edit-disc-submit">
            {loading ? <><div className="spinner" /> Güncelleniyor...</> : <>💾 Güncelle</>}
          </button>
        </div>
      </form>
    </div>
  )
}
