'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BADGE_OPTIONS, type Company, type Location } from '@/lib/types'

export default function NewDiscountPage() {
  const router = useRouter()
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('locations').select('*, companies(name)').order('city'),
    ]).then(([companiesRes, locsRes]) => {
      setCompanies(companiesRes.data ?? [])
      setLocations((locsRes.data ?? []) as Location[])
    })
  }, [])

  // Filter locations when company changes
  useEffect(() => {
    if (form.company_id) {
      const locs = locations.filter(l => l.company_id === form.company_id)
      setFilteredLocations(locs)
      setForm(f => ({ ...f, location_id: locs[0]?.id ?? '' }))
    } else {
      setFilteredLocations(locations)
    }
  }, [form.company_id, locations])

  // Auto-calculate discounted price
  useEffect(() => {
    if (form.original_price && form.discount_percent) {
      const orig = parseFloat(form.original_price)
      if (!isNaN(orig)) {
        const discounted = orig * (1 - form.discount_percent / 100)
        setForm(f => ({ ...f, discounted_price: discounted.toFixed(2) }))
      }
    }
  }, [form.original_price, form.discount_percent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_id) { setError('Firma seçiniz.'); return }
    if (!form.location_id) { setError('Lokasyon seçiniz.'); return }
    if (!form.description.trim()) { setError('Açıklama zorunludur.'); return }
    if (!form.valid_until) { setError('Bitiş tarihi zorunludur.'); return }

    setLoading(true)
    setError('')

    const { error: insertErr } = await supabase.from('discounts').insert({
      company_id: form.company_id,
      location_id: form.location_id,
      description: form.description.trim(),
      discount_percent: form.discount_percent,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
      badge: form.badge || null,
      valid_until: new Date(form.valid_until).toISOString(),
      is_active: form.is_active,
    })

    if (insertErr) {
      setError(`Kayıt hatası: ${insertErr.message}`)
      setLoading(false)
    } else {
      router.push('/discounts')
    }
  }

  // Default valid_until: 7 days from now
  const defaultDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 16)
  }

  useEffect(() => {
    setForm(f => ({ ...f, valid_until: defaultDate() }))
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Yeni İndirim Ekle</h1>
          <p className="page-subtitle">Firma ve lokasyon için indirim tanımlayın</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 750 }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Firma & Lokasyon */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Firma & Lokasyon</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="disc-company">Firma</label>
              <select
                id="disc-company"
                className="form-select"
                value={form.company_id}
                onChange={e => setForm({ ...form, company_id: e.target.value })}
                required
              >
                <option value="">Firma seçin...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="disc-location">Lokasyon</label>
              <select
                id="disc-location"
                className="form-select"
                value={form.location_id}
                onChange={e => setForm({ ...form, location_id: e.target.value })}
                required
                disabled={!form.company_id}
              >
                <option value="">Lokasyon seçin...</option>
                {filteredLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.city} — {l.address.slice(0, 40)}{l.address.length > 40 ? '...' : ''}
                  </option>
                ))}
              </select>
              {form.company_id && filteredLocations.length === 0 && (
                <div className="form-hint">
                  Bu firmaya ait lokasyon yok.{' '}
                  <a href="/locations/new" style={{ color: 'var(--primary)' }}>Lokasyon Ekle →</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* İndirim Detayları */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">İndirim Detayları</div>
          </div>

          {/* Discount percent slider */}
          <div className="form-group">
            <label className="form-label form-label-required">İndirim Oranı</label>
            <div className="range-wrapper">
              <input
                id="disc-percent-range"
                type="range"
                className="form-range"
                min={1}
                max={100}
                value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: parseInt(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${form.discount_percent}%, var(--bg-surface3) ${form.discount_percent}%, var(--bg-surface3) 100%)`
                }}
              />
              <div className="range-value">%{form.discount_percent}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>
              <span>%1</span>
              <span>%25</span>
              <span>%50 🔥</span>
              <span>%75</span>
              <span>%100</span>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="disc-desc">Açıklama</label>
            <textarea
              id="disc-desc"
              className="form-textarea"
              placeholder="Örn: Tüm ürünlerde %20 indirim, sezon sonu fırsatı!"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="form-grid">
            {/* Original Price */}
            <div className="form-group">
              <label className="form-label" htmlFor="disc-original-price">Orijinal Fiyat (₺)</label>
              <input
                id="disc-original-price"
                type="number"
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min={0}
                value={form.original_price}
                onChange={e => setForm({ ...form, original_price: e.target.value })}
              />
            </div>

            {/* Discounted Price (auto-calculated) */}
            <div className="form-group">
              <label className="form-label" htmlFor="disc-discounted-price">
                İndirimli Fiyat (₺)
                {form.original_price && <span style={{ color: 'var(--primary)', fontSize: 10, marginLeft: 4 }}>otomatik</span>}
              </label>
              <input
                id="disc-discounted-price"
                type="number"
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min={0}
                value={form.discounted_price}
                onChange={e => setForm({ ...form, discounted_price: e.target.value })}
              />
            </div>

            {/* Badge */}
            <div className="form-group">
              <label className="form-label" htmlFor="disc-badge">Badge (Opsiyonel)</label>
              <select
                id="disc-badge"
                className="form-select"
                value={form.badge}
                onChange={e => setForm({ ...form, badge: e.target.value })}
              >
                <option value="">Badge yok</option>
                {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Valid Until */}
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="disc-valid-until">Bitiş Tarihi</label>
              <input
                id="disc-valid-until"
                type="datetime-local"
                className="form-input"
                value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="form-group">
            <div className="toggle-wrapper">
              <label className="toggle">
                <input
                  id="disc-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">
                {form.is_active ? '✅ Aktif — uygulamada görünür' : '⏸ Pasif — uygulamada gizli'}
              </span>
            </div>
          </div>
        </div>

        {/* Preview */}
        {form.discount_percent > 0 && (
          <div className="card" style={{ marginBottom: 20, borderColor: 'var(--border-active)' }}>
            <div className="card-header">
              <div className="card-title">Önizleme</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: 'white',
                fontSize: 28,
                fontWeight: 900,
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-accent)',
                letterSpacing: -1,
              }}>
                %{form.discount_percent}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>
                  {companies.find(c => c.id === form.company_id)?.name ?? 'Firma Seçilmedi'}
                </div>
                {form.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                    {form.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  {form.badge && <span className="badge badge-warning">{form.badge}</span>}
                  {form.original_price && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₺{parseFloat(form.original_price).toLocaleString('tr-TR')}
                    </span>
                  )}
                  {form.discounted_price && (
                    <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 800 }}>
                      ₺{parseFloat(form.discounted_price).toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/discounts')} id="disc-cancel">
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} id="disc-submit">
            {loading ? <><div className="spinner" /> Kaydediliyor...</> : <>🏷️ İndirimi Kaydet</>}
          </button>
        </div>
      </form>
    </div>
  )
}
