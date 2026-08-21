'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  CATEGORY_LABELS, CATEGORY_EMOJIS,
  type DiscountCategory
} from '@/lib/types'

export default function NewCompanyPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    category: 'food' as DiscountCategory,
    phone: '',
    website: '',
    is_active: true,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin.')
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Firma adı zorunludur.')
      return
    }
    setLoading(true)
    setError('')

    let logo_url: string | null = null

    // Upload logo if selected
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('company-logos')
        .upload(path, logoFile)

      if (uploadErr) {
        setError(`Logo yüklenemedi: ${uploadErr.message}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(path)
      logo_url = urlData.publicUrl
    }

    const { error: insertErr } = await supabase.from('companies').insert({
      name: form.name.trim(),
      category: form.category,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      is_active: form.is_active,
      logo_url,
    })

    if (insertErr) {
      setError(`Kayıt hatası: ${insertErr.message}`)
      setLoading(false)
    } else {
      router.push('/companies')
    }
  }

  const categories = Object.entries(CATEGORY_LABELS) as [DiscountCategory, string][]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Yeni Firma Ekle</h1>
          <p className="page-subtitle">Sisteme yeni bir firma kaydı oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Temel Bilgiler</div>
          </div>

          <div className="form-grid">
            {/* Name */}
            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="company-name">
                Firma Adı
              </label>
              <input
                id="company-name"
                type="text"
                className="form-input"
                placeholder="Örn: Zara, McDonald's, MediaMarkt..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="form-group form-full">
              <label className="form-label form-label-required" htmlFor="company-category">
                Kategori
              </label>
              {/* Category chips */}
              <div className="category-chips" style={{ marginBottom: 8 }}>
                {categories.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`category-chip ${form.category === key ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, category: key })}
                    id={`category-chip-${key}`}
                  >
                    <span>{CATEGORY_EMOJIS[key]}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="company-phone">Telefon</label>
              <input
                id="company-phone"
                type="tel"
                className="form-input"
                placeholder="+90 555 000 00 00"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Website */}
            <div className="form-group">
              <label className="form-label" htmlFor="company-website">Web Sitesi</label>
              <input
                id="company-website"
                type="url"
                className="form-input"
                placeholder="https://firmaadi.com"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
              />
            </div>

            {/* Active toggle */}
            <div className="form-group form-full">
              <div className="toggle-wrapper">
                <label className="toggle">
                  <input
                    id="company-active"
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
        </div>

        {/* Logo Upload */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Logo (Opsiyonel)</div>
          </div>

          {logoPreview ? (
            <div style={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Logo preview" className="upload-preview" />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  id="logo-remove"
                >
                  Kaldır
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  id="logo-change"
                >
                  Değiştir
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              id="logo-upload-area"
            >
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">Logo yüklemek için tıklayın veya sürükleyin</div>
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

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push('/companies')}
            id="company-cancel"
          >
            İptal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="company-submit"
          >
            {loading ? (
              <><div className="spinner" /> <span>Kaydediliyor...</span></>
            ) : (
              <><span>💾</span><span>Firmayı Kaydet</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
