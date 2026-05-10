// ArcGIS World Geocoder — keyless fallback for addresses Kakao misses.
// Mirrors packages/baeknyeon/src/sbiz/arcgisGeocoder.ts.

export type GeocodePoint = { lat: number; lng: number }

const ARCGIS_ADDRESS_ENDPOINT =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'

export async function geocodeAddressWithArcGis(query: string): Promise<GeocodePoint | null> {
  const url = new URL(ARCGIS_ADDRESS_ENDPOINT)
  url.searchParams.set('SingleLine', query)
  url.searchParams.set('f', 'json')
  url.searchParams.set('maxLocations', '1')
  url.searchParams.set('outSR', '4326')

  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `ArcGIS geocoding request failed: HTTP ${response.status}${body ? ` ${body}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const first = asArray(asRecord(payload).candidates).map(asRecord)[0]
  if (!first) return null

  const location = asRecord(first.location)
  const lng = Number(toStringValue(location.x))
  const lat = Number(toStringValue(location.y))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isWgs84KoreaPoint(lat, lng)) return null

  return { lat, lng }
}

function isWgs84KoreaPoint(lat: number, lng: number): boolean {
  return lat >= 30 && lat <= 45 && lng >= 120 && lng <= 140
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
