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

const PROVINCE_PREFIX_ALIASES: Record<string, string> = {
  서울: '서울특별시',
  서울시: '서울특별시',
  부산: '부산광역시',
  부산시: '부산광역시',
  대구: '대구광역시',
  대구시: '대구광역시',
  인천: '인천광역시',
  인천시: '인천광역시',
  광주: '광주광역시',
  광주시: '광주광역시',
  대전: '대전광역시',
  대전시: '대전광역시',
  울산: '울산광역시',
  울산시: '울산광역시',
  세종: '세종특별자치시',
  세종시: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
}

const COUNTY_ALIASES: Record<string, string> = {
  '서울특별시 동대무': '동대문구',
  '경상북도 김청시': '김천시',
  '경상남도 통영': '통영시',
  '경상남도 마산시': '창원시',
}

export function normalizeMetropolitanAddress(value: string): string {
  const match = value.match(/^(\S+)(?:\s+(\S+))?/)
  if (!match) return value

  const province = PROVINCE_PREFIX_ALIASES[match[1]] ?? match[1]
  const county = match[2] ? COUNTY_ALIASES[`${province} ${match[2]}`] ?? match[2] : undefined
  const prefix = county ? `${province} ${county}` : province

  return `${prefix}${value.slice(match[0].length)}`
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
