'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom green marker for indirimGO
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="#00E676"/>
      <circle cx="16" cy="16" r="8" fill="#0D0B1A"/>
      <circle cx="16" cy="16" r="4" fill="#00E676"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

interface ClickHandlerProps {
  onChange: (lat: number, lng: number) => void
}

function ClickHandler({ onChange }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onChange(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6))
      )
    },
  })
  return null
}

interface MapPickerClientProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export default function MapPickerClient({ lat, lng, onChange }: MapPickerClientProps) {
  return (
    <div>
      <div className="map-picker-container" style={{ height: 340 }}>
        <div className="map-picker-info">
          📍 Konumu seçmek için haritaya tıklayın
        </div>
        <MapContainer
          center={[lat || 39.9334, lng || 32.8597]}
          zoom={lat ? 14 : 6}
          style={{ height: '100%', width: '100%' }}
          key={`${lat}-${lng}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {lat && lng && (
            <Marker position={[lat, lng]} icon={customIcon} />
          )}
        </MapContainer>
      </div>

      {/* Coordinates display */}
      <div className="map-coords-display">
        <div className="map-coord-item">
          <span className="map-coord-label">Enlem</span>
          <span className="map-coord-value">{lat ? lat.toFixed(6) : '—'}</span>
        </div>
        <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
        <div className="map-coord-item">
          <span className="map-coord-label">Boylam</span>
          <span className="map-coord-value">{lng ? lng.toFixed(6) : '—'}</span>
        </div>
        {lat && lng && (
          <>
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--info)', fontSize: 11, marginLeft: 'auto' }}
            >
              Google Maps&apos;te Aç ↗
            </a>
          </>
        )}
      </div>

      {/* Manual input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
        <div>
          <label className="form-label" htmlFor="map-lat-input">Enlem (elle girin)</label>
          <input
            id="map-lat-input"
            type="number"
            className="form-input"
            step="any"
            placeholder="39.9334"
            value={lat || ''}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(v, lng)
            }}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="map-lng-input">Boylam (elle girin)</label>
          <input
            id="map-lng-input"
            type="number"
            className="form-input"
            step="any"
            placeholder="32.8597"
            value={lng || ''}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(lat, v)
            }}
          />
        </div>
      </div>
    </div>
  )
}
