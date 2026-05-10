import { getCountyLabel, getProvinceLabel } from '@food-guides/shared/regions'
import { isRestaurantCategory, type Restaurant } from '../domain/restaurants'

export type RestaurantDataManifest = {
  schemaVersion: 1
  source: 'SBIZ HPTC006'
  generatedAt: string
  count: number
  sha256: string
}

export type RestaurantDataValidationOptions = {
  minRows?: number
}

export type RestaurantDataValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const DEFAULT_MIN_ROWS = 900
const KOREA_BOUNDS = {
  minLat: 30,
  maxLat: 45,
  minLng: 120,
  maxLng: 140,
}
const KNOWN_PROVINCES = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '세종'])
const DEFERRED_FIELDS = ['mainMenu']

export function validateRestaurantData(value: unknown, options: RestaurantDataValidationOptions = {}): RestaurantDataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(value)) {
    return { ok: false, errors: ['restaurant data must be a JSON array'], warnings }
  }

  const minRows = options.minRows ?? DEFAULT_MIN_ROWS
  if (value.length < minRows) {
    errors.push(`row count ${value.length} is below minimum ${minRows}`)
  }

  const seenIds = new Set<string>()

  value.forEach((row, index) => {
    const rowNumber = index + 1
    if (!isRecord(row)) {
      errors.push(`row ${rowNumber} is not an object`)
      return
    }

    for (const field of DEFERRED_FIELDS) {
      if (field in row) errors.push(`row ${rowNumber} contains deferred field ${field}`)
    }

    const id = readString(row, 'id')
    const name = readString(row, 'name')
    const category = readString(row, 'category')
    const region = readString(row, 'region')
    const address = readString(row, 'address')
    const lat = Number(row.lat)
    const lng = Number(row.lng)
    const sourceUrl = readOptionalString(row, 'sourceUrl')

    if (!id) {
      errors.push(`row ${rowNumber} is missing id`)
    } else if (seenIds.has(id)) {
      errors.push(`duplicate id: ${id}`)
    } else {
      seenIds.add(id)
    }

    if (!name) errors.push(`row ${rowNumber} is missing name`)
    if (!category) {
      errors.push(`row ${rowNumber} is missing category`)
    } else if (!isRestaurantCategory(category)) {
      errors.push(`row ${rowNumber} category is not restaurant-like: ${category}`)
    }
    if (!region) errors.push(`row ${rowNumber} is missing region`)
    if (!address) errors.push(`row ${rowNumber} is missing address`)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push(`row ${rowNumber} has non-numeric coordinates`)
    } else if (!isWithinKoreaBounds(lat, lng)) {
      errors.push(`row ${rowNumber} has coordinates outside Korea bounds`)
    }

    if (address) {
      const province = getProvinceLabel(address)
      const county = getCountyLabel(address)
      if (!KNOWN_PROVINCES.has(province)) errors.push(`row ${rowNumber} has unknown province: ${province}`)
      if (!county) errors.push(`row ${rowNumber} is missing county label`)
      if (['동대무', '김청시', '마산시', '통영'].includes(county)) errors.push(`row ${rowNumber} has unnormalized county: ${county}`)
    }

    if (sourceUrl && !isSafeSbizDetailUrl(sourceUrl)) {
      errors.push(`row ${rowNumber} has invalid sourceUrl host/path`)
    }
  })

  return { ok: errors.length === 0, errors, warnings }
}

export function createRestaurantDataManifest(rows: Restaurant[], sha256: string): RestaurantDataManifest {
  return {
    schemaVersion: 1,
    source: 'SBIZ HPTC006',
    generatedAt: new Date().toISOString(),
    count: rows.length,
    sha256,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isWithinKoreaBounds(lat: number, lng: number): boolean {
  return lat >= KOREA_BOUNDS.minLat && lat <= KOREA_BOUNDS.maxLat && lng >= KOREA_BOUNDS.minLng && lng <= KOREA_BOUNDS.maxLng
}

function isSafeSbizDetailUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'www.sbiz.or.kr' && url.pathname === '/hdst/main/ohndMarketDetail.do'
  } catch {
    return false
  }
}
