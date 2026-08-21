'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, type Company } from '@/lib/types'
import CustomSelect from '@/components/ui/CustomSelect'
import MapPicker from '@/components/map/MapPicker'

const TURKISH_CITIES = [
  'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Eskişehir',
  'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya',
  'Malatya', 'Mersin', 'Samsun', 'Şanlıurfa', 'Trabzon',
]

export default function NewLocationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState({
    company_id: '',
    address: '',
    city: '',
    mall_name: '',
    floor: '',
    latitude: 0,
    longitude: 0,
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('companies').select('*').order('name').then(({ data }) => {
      setCompanies(data ?? [])
      if (data?.[0]) setForm(f => ({ ...f, company_id: data[0].id }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_id) { setError('Firma seçiniz.'); return }
    if (!form.address.trim()) { setError('Adres zorunludur.'); return }
    if (!form.city.trim()) { setError('Şehir zorunludur.'); return }
    if (!form.latitude || !form.longitude) { setError('Lütfen haritadan konum seçin.'); return }

    setLoading(true)
    setError('')

    const { error: insertErr } = await supabase.from('locations').insert({
      company_id: form.company_id,
      address: form.address.trim(),
      city: form.city.trim(),
      mall_name: form.mall_name.trim() || null,
      floor: form.floor.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      is_active: form.is_active,
    })

    if (insertErr) {
      setError(`Kayıt hatası: ${insertErr.message}`)
      setLoading(false)
    } else {
      router.push('/locations')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Yeni Lokasyon Ekle</h1>
          <p className="page-subtitle">Mağaza veya şube konumu tanımlayın</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Temel Bilgiler */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Temel Bilgiler</div>
          </div>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="loc-company">Firma</label>
              <CustomSelect
                id="loc-company"
                value={form.company_id}
                onChange={val => setForm({ ...form, company_id: val })}
                placeholder="Firma seçin..."
                searchable
                options={companies.map(c => ({
                  value: c.id,
                  label: c.name,
                  icon: CATEGORY_EMOJIS[c.category],
                }))}
              />
              {companies.length === 0 && (
                <div className="form-hint">
                  Önce firma eklemeniz gerekiyor.{' '}
                  <a href="/companies/new" style={{ color: 'var(--primary)' }}>Firma Ekle →</a>
                </div>
              )}
            </div>

            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="loc-address">Adres</label>
              <textarea
                id="loc-address"
                className="form-textarea"
                placeholder="Örn: Bağdat Caddesi No:42 Kadıköy"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                required
                style={{ minHeight: 70 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="loc-city">Şehir</label>
              <CustomSelect
                id="loc-city"
                value={form.city}
                onChange={val => setForm({ ...form, city: val })}
                placeholder="Şehir seçin..."
                searchable
                options={TURKISH_CITIES.map(c => ({
                  value: c,
                  label: c,
                  icon: '📌',
                }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="loc-mall">AVM Adı (Opsiyonel)</label>
              <input
                id="loc-mall"
                type="text"
                className="form-input"
                placeholder="Örn: Cevahir AVM"
                value={form.mall_name}
                onChange={e => setForm({ ...form, mall_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="loc-floor">Kat (Opsiyonel)</label>
              <input
                id="loc-floor"
                type="text"
                className="form-input"
                placeholder="Örn: Kat 2, Zemin Kat"
                value={form.floor}
                onChange={e => setForm({ ...form, floor: e.target.value })}
              />
            </div>

            <div className="form-group form-full">
              <div className="toggle-wrapper">
                <label className="toggle">
                  <input
                    id="loc-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label">
                  {form.is_active ? '✅ Aktif — haritada görünür' : '⏸ Pasif — haritada gizli'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Harita */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Konum Seçimi</div>
              <div className="card-subtitle">Haritaya tıklayarak veya koordinat girerek konum belirleyin</div>
            </div>
          </div>
          <MapPicker
            lat={form.latitude}
            lng={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/locations')} id="loc-cancel">
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} id="loc-submit">
            {loading ? <><div className="spinner" /> Kaydediliyor...</> : <>📍 Lokasyonu Kaydet</>}
          </button>
        </div>
      </form>
    </div>
  )
}
