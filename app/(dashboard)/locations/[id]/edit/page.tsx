'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORY_EMOJIS, type Company } from '@/lib/types'
import CustomSelect from '@/components/ui/CustomSelect'
import MapPicker from '@/components/map/MapPicker'

const TURKISH_CITIES = [
  'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Eskişehir',
  'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya',
  'Malatya', 'Mersin', 'Samsun', 'Şanlıurfa', 'Trabzon',
]

export default function EditLocationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
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
  const [fetchLoading, setFetchLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('locations').select('*').eq('id', id).single(),
    ]).then(([companiesRes, locRes]) => {
      setCompanies(companiesRes.data ?? [])
      if (locRes.data) {
        const d = locRes.data
        setForm({
          company_id: d.company_id,
          address: d.address,
          city: d.city,
          mall_name: d.mall_name ?? '',
          floor: d.floor ?? '',
          latitude: d.latitude,
          longitude: d.longitude,
          is_active: d.is_active,
        })
      }
      setFetchLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateErr } = await supabase.from('locations').update({
      company_id: form.company_id,
      address: form.address.trim(),
      city: form.city.trim(),
      mall_name: form.mall_name.trim() || null,
      floor: form.floor.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      is_active: form.is_active,
    }).eq('id', id)

    if (updateErr) {
      setError(`Güncelleme hatası: ${updateErr.message}`)
      setLoading(false)
    } else {
      router.push('/locations')
    }
  }

  if (fetchLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <span>Lokasyon bilgileri yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lokasyon Düzenle</h1>
          <p className="page-subtitle">{form.address}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">Temel Bilgiler</div></div>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="edit-loc-company">Firma</label>
              <CustomSelect
                id="edit-loc-company"
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

            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="edit-loc-address">Adres</label>
              <textarea
                id="edit-loc-address"
                className="form-textarea"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ minHeight: 70 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="edit-loc-city">Şehir</label>
              <CustomSelect
                id="edit-loc-city"
                value={form.city}
                onChange={val => setForm({ ...form, city: val })}
                searchable
                options={TURKISH_CITIES.map(c => ({
                  value: c,
                  label: c,
                  icon: '📌',
                }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-loc-mall">AVM Adı</label>
              <input id="edit-loc-mall" type="text" className="form-input"
                value={form.mall_name} onChange={e => setForm({ ...form, mall_name: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-loc-floor">Kat</label>
              <input id="edit-loc-floor" type="text" className="form-input"
                value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
            </div>

            <div className="form-group form-full">
              <div className="toggle-wrapper">
                <label className="toggle">
                  <input id="edit-loc-active" type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label">{form.is_active ? '✅ Aktif' : '⏸ Pasif'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Konum</div>
          </div>
          <MapPicker
            lat={form.latitude}
            lng={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/locations')} id="edit-loc-cancel">
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} id="edit-loc-submit">
            {loading ? <><div className="spinner" /> Güncelleniyor...</> : <>💾 Güncelle</>}
          </button>
        </div>
      </form>
    </div>
  )
}
