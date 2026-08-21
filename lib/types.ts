export type DiscountCategory =
  | 'fashion'
  | 'food'
  | 'electronics'
  | 'beauty'
  | 'sports'
  | 'home'
  | 'supermarket'
  | 'entertainment'

export const CATEGORY_LABELS: Record<DiscountCategory, string> = {
  fashion: 'Giyim & Moda',
  food: 'Yiyecek & İçecek',
  electronics: 'Elektronik',
  beauty: 'Güzellik & Bakım',
  sports: 'Spor',
  home: 'Ev & Yaşam',
  supermarket: 'Market',
  entertainment: 'Eğlence',
}

export const CATEGORY_EMOJIS: Record<DiscountCategory, string> = {
  fashion: '👗',
  food: '🍔',
  electronics: '📱',
  beauty: '💄',
  sports: '⚽',
  home: '🏠',
  supermarket: '🛒',
  entertainment: '🎬',
}

export const CATEGORY_COLORS: Record<DiscountCategory, string> = {
  fashion: '#E91E8C',
  food: '#FF6B35',
  electronics: '#1565C0',
  beauty: '#9C27B0',
  sports: '#2E7D32',
  home: '#5D4037',
  supermarket: '#00897B',
  entertainment: '#F57C00',
}

export const BADGE_OPTIONS = [
  'Flaş İndirim',
  'Son Saatler',
  'Özel Teklif',
  'Haftanın Fırsatı',
  'Sınırlı Stok',
  'Yeni Sezon',
  'Clearance',
]

export interface Company {
  id: string
  name: string
  logo_url: string | null
  category: DiscountCategory
  phone: string | null
  website: string | null
  is_active: boolean
  created_at: string
}

export interface Location {
  id: string
  company_id: string
  address: string
  city: string
  latitude: number
  longitude: number
  mall_name: string | null
  floor: string | null
  is_active: boolean
  created_at: string
  companies?: Company
}

export interface Discount {
  id: string
  company_id: string
  location_id: string
  description: string
  discount_percent: number
  original_price: number | null
  discounted_price: number | null
  badge: string | null
  valid_until: string
  is_active: boolean
  rating: number | null
  review_count: number | null
  created_at: string
  companies?: Company
  locations?: Location
}
