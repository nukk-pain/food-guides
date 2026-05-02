import type { GeocodePoint } from './parser'

export type JusoAddressLookup = {
  admCd: string
  rnMgtSn: string
  udrtYn: string
  buldMnnm: string
  buldSlno: string
}

const JUSO_SEARCH_ENDPOINT = 'https://business.juso.go.kr/addrlink/addrLinkApi.do'
const JUSO_COORD_ENDPOINT = 'https://business.juso.go.kr/addrlink/addrCoordApi.do'

export function buildJusoSearchUrl(keyword: string, confirmationKey: string): URL {
  const url = new URL(JUSO_SEARCH_ENDPOINT)
  url.searchParams.set('confmKey', confirmationKey)
  url.searchParams.set('currentPage', '1')
  url.searchParams.set('countPerPage', '1')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('resultType', 'json')
  return url
}

export function buildJusoCoordUrl(lookup: JusoAddressLookup, confirmationKey: string): URL {
  const url = new URL(JUSO_COORD_ENDPOINT)
  url.searchParams.set('confmKey', confirmationKey)
  url.searchParams.set('admCd', lookup.admCd)
  url.searchParams.set('rnMgtSn', lookup.rnMgtSn)
  url.searchParams.set('udrtYn', lookup.udrtYn)
  url.searchParams.set('buldMnnm', lookup.buldMnnm)
  url.searchParams.set('buldSlno', lookup.buldSlno)
  url.searchParams.set('resultType', 'json')
  return url
}

export function parseJusoSearchResponse(payload: unknown): JusoAddressLookup | null {
  const results = asRecord(asRecord(payload).results)
  if (!isSuccessfulJusoResponse(results)) return null

  const first = asArray(results.juso).map(asRecord)[0]
  if (!first) return null

  const lookup = {
    admCd: toStringValue(first.admCd),
    rnMgtSn: toStringValue(first.rnMgtSn),
    udrtYn: toStringValue(first.udrtYn),
    buldMnnm: toStringValue(first.buldMnnm),
    buldSlno: toStringValue(first.buldSlno),
  }

  if (Object.values(lookup).some((value) => value.length === 0)) return null
  return lookup
}

export function parseJusoCoordResponse(payload: unknown): GeocodePoint | null {
  const results = asRecord(asRecord(payload).results)
  if (!isSuccessfulJusoResponse(results)) return null

  const first = asArray(results.juso).map(asRecord)[0]
  if (!first) return null

  const lng = Number(toStringValue(first.entX ?? first.x))
  const lat = Number(toStringValue(first.entY ?? first.y))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isWgs84KoreaPoint(lat, lng)) return null

  return { lat, lng }
}

export async function geocodeRoadAddressWithJuso(address: string, confirmationKey: string): Promise<GeocodePoint | null> {
  const searchResponse = await fetchJson(buildJusoSearchUrl(address, confirmationKey))
  const lookup = parseJusoSearchResponse(searchResponse)
  if (!lookup) return null

  const coordResponse = await fetchJson(buildJusoCoordUrl(lookup, confirmationKey))
  return parseJusoCoordResponse(coordResponse)
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Juso API request failed: HTTP ${response.status}`)
  return response.json() as Promise<unknown>
}

function isSuccessfulJusoResponse(results: Record<string, unknown>): boolean {
  const common = asRecord(results.common)
  const errorCode = toStringValue(common.errorCode)
  return errorCode === '' || errorCode === '0'
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
