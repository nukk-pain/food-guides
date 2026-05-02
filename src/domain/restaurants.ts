export type Restaurant = {
  id: string
  name: string
  category: string
  region: string
  address: string
  lat: number
  lng: number
  phone?: string
  sourceUrl?: string
}

export type RawRestaurant = Partial<Omit<Restaurant, 'lat' | 'lng'>> & {
  lat?: number | string
  lng?: number | string
}

const RESTAURANT_CATEGORY_KEYWORDS = ['음식점업', '식당', '한식', '중식', '일식', '양식', '분식', '카페']

const OFFICIAL_CITY_PREFIXES: Record<string, string> = {
  서울시: '서울특별시',
  대구시: '대구광역시',
}

export function normalizeMetropolitanAddress(value: string): string {
  return value.replace(/^(서울시|대구시)(?=\s)/, (city) => OFFICIAL_CITY_PREFIXES[city] ?? city)
}

export function normalizeRestaurant(row: RawRestaurant): Restaurant | null {
  const lat = Number(row.lat)
  const lng = Number(row.lng)

  if (!row.id || !row.name || !row.category || !row.region || !row.address) {
    return null
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  const region = normalizeMetropolitanAddress(row.region)
  const address = normalizeMetropolitanAddress(row.address)

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    region,
    address,
    lat,
    lng,
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.sourceUrl ? { sourceUrl: row.sourceUrl } : {}),
  }
}

export function isRestaurantCategory(category: string): boolean {
  return RESTAURANT_CATEGORY_KEYWORDS.some((keyword) => category.includes(keyword))
}

export function filterRestaurantStores(rows: RawRestaurant[]): Restaurant[] {
  return rows
    .map(normalizeRestaurant)
    .filter((row): row is Restaurant => Boolean(row))
    .filter((row) => isRestaurantCategory(row.category))
}
