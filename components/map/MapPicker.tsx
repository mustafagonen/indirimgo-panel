'use client'

import dynamic from 'next/dynamic'

// SSR disabled because Leaflet requires browser APIs
const MapPickerClient = dynamic(() => import('./MapPickerClient'), { ssr: false })

interface MapPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export default function MapPicker(props: MapPickerProps) {
  return <MapPickerClient {...props} />
}
