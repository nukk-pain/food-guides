import type { GeocodePoint } from './parser'

const KAKAO_ADDRESS_ENDPOINT = 'https://dapi.kakao.com/v2/local/search/address.json'

export function buildKakaoAddressUrl(query: string): URL {
  const url = new URL(KAKAO_ADDRESS_ENDPOINT)
  url.searchParams.set('query', query)
  url.searchParams.set('analyze_type', 'similar')
  url.searchParams.set('page', '1')
  url.searchParams.set('size', '1')
  return url
}

export function parseKakaoAddressResponse(payload: unknown): GeocodePoint | null {
  const first = asArray(asRecord(payload).documents).map(asRecord)[0]
  if (!first) return null

  const lng = Number(toStringValue(first.x))
  const lat = Number(toStringValue(first.y))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isWgs84KoreaPoint(lat, lng)) return null

  return { lat, lng }
}

export async function geocodeAddressWithKakao(query: string, restApiKey: string): Promise<GeocodePoint | null> {
  const response = await fetch(buildKakaoAddressUrl(query), {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Kakao Local API request failed: HTTP ${response.status}${body ? ` ${body}` : ''}`)
  }

  return parseKakaoAddressResponse(await response.json())
}

function isWgs84KoreaPoint(lat: number, lng: number): boolean {
  return lat >= 30 && lat <= 45 && lng >= 120 && lng <= 140
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
