'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORY_LABELS, CATEGORY_EMOJIS, type DiscountCategory } from '@/lib/types'

export default function EditCompanyPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    category: 'food' as DiscountCategory,
    phone: '',
    website: '',
    is_active: true,
  })
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCompany()
  }, [id])

  const fetchCompany = async () => {
    const { data } = await supabase.from('companies').select('*').eq('id', id).single()
    if (data) {
      setForm({
        name: data.name,
        category: data.category,
        phone: data.phone ?? '',
        website: data.website ?? '',
        is_active: data.is_active,
      })
      setCurrentLogoUrl(data.logo_url)
    }
    setFetchLoading(false)
  }

  const handleFileSelect = (file: File) => {
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let logo_url = currentLogoUrl

    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('company-logos')
        .upload(path, logoFile)

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }
    }

    const { error: updateErr } = await supabase.from('companies').update({
      name: form.name.trim(),
      category: form.category,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      is_active: form.is_active,
      logo_url,
    }).eq('id', id)

    if (updateErr) {
      setError(`Güncelleme hatası: ${updateErr.message}`)
      setLoading(false)
    } else {
      router.push('/companies')
    }
  }

  const categories = Object.entries(CATEGORY_LABELS) as [DiscountCategory, string][]
  const displayLogo = logoPreview ?? currentLogoUrl

  if (fetchLoading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <span>Firma bilgileri yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Firma Düzenle</h1>
          <p className="page-subtitle">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Temel Bilgiler</div>
          </div>

          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="edit-company-name">Firma Adı</label>
              <input
                id="edit-company-name"
                type="text"
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label form-label-required">Kategori</label>
              <div className="category-chips" style={{ marginBottom: 8 }}>
                {categories.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`category-chip ${form.category === key ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, category: key })}
                  >
                    <span>{CATEGORY_EMOJIS[key]}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-company-phone">Telefon</label>
              <input
                id="edit-company-phone"
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-company-website">Web Sitesi</label>
              <input
                id="edit-company-website"
                type="url"
                className="form-input"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="form-group form-full">
              <div className="toggle-wrapper">
                <label className="toggle">
                  <input
                    id="edit-company-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label">
                  {form.is_active ? '✅ Aktif' : '⏸ Pasif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Logo</div>
          </div>

          {displayLogo ? (
            <div style={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayLogo} alt="Logo" className="upload-preview" />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setCurrentLogoUrl(null) }}
                >
                  Kaldır
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Değiştir
                </button>
              </div>
            </div>
          ) : (
            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
              id="edit-logo-upload"
            >
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">Logo yüklemek için tıklayın</div>
              <div className="upload-sub">PNG, JPG, SVG — maks. 2MB</div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/companies')} id="edit-cancel">
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} id="edit-company-submit">
            {loading ? <><div className="spinner" /> Güncelleniyor...</> : <>💾 Güncelle</>}
          </button>
        </div>
      </form>
    </div>
  )
}
