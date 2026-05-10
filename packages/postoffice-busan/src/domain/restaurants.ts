import { REGIONS, type Region } from './postOffices'

export type Restaurant = {
  id: string
  name: string
  postOffice: string
  postOfficeArea: string | null
  region: Region
  recommendationNo: number
  description: string
  menu: string
  address: string
  phone: string
  hours: string
  pdfPage: number
  images: string[]
  lat: number | null
  lng: number | null
}

export type RawRestaurant = Partial<Omit<Restaurant, 'lat' | 'lng' | 'images' | 'recommendationNo' | 'pdfPage'>> & {
  lat?: number | string | null
  lng?: number | string | null
  images?: string[]
  recommendationNo?: number | string
  pdfPage?: number | string
}

export function normalizeRestaurant(row: RawRestaurant): Restaurant | null {
  if (!row.id || !row.name || !row.address || !row.postOffice || !row.region) {
    return null
  }
  if (!REGIONS.includes(row.region as Region)) {
    return null
  }

  const lat = row.lat == null ? null : Number(row.lat)
  const lng = row.lng == null ? null : Number(row.lng)

  return {
    id: row.id,
    name: row.name,
    postOffice: row.postOffice,
    postOfficeArea: row.postOfficeArea ?? null,
    region: row.region as Region,
    recommendationNo: Number(row.recommendationNo ?? 0),
    description: row.description ?? '',
    menu: row.menu ?? '',
    address: row.address,
    phone: row.phone ?? '',
    hours: row.hours ?? '',
    pdfPage: Number(row.pdfPage ?? 0),
    images: Array.isArray(row.images) ? row.images : [],
    lat: lat != null && Number.isFinite(lat) ? lat : null,
    lng: lng != null && Number.isFinite(lng) ? lng : null,
  }
}

export function normalizeRestaurants(rows: RawRestaurant[]): Restaurant[] {
  return rows.map(normalizeRestaurant).filter((r): r is Restaurant => r !== null)
}

export function hasCoordinates(r: Restaurant): boolean {
  return r.lat !== null && r.lng !== null
}
