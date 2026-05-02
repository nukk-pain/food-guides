import type { RawRestaurant, Restaurant } from '../domain/restaurants'

export const SBIZ_LIST_URL = 'https://www.sbiz.or.kr/hdst/main/ohndMarketList.do'
export const SBIZ_DETAIL_URL = 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do'
export const RESTAURANT_CATEGORY_CODE = 'HPTC006'

export type SbizListRow = {
  id: string
  name: string
  category: string
  phone?: string
  address: string
  sourceUrl: string
}

export type SbizListPage = {
  totalCount: number
  currentPage: number
  totalPages: number
  rows: SbizListRow[]
}

export type GeocodePoint = {
  lat: number
  lng: number
}

export type GeocodeCache = Record<string, GeocodePoint>

export function buildSbizListPayload({ page }: { page: number }): URLSearchParams {
  return new URLSearchParams({
    searchCity: '',
    searchCounty: '',
    searchTpbsCd: RESTAURANT_CATEGORY_CODE,
    currentPage: String(page),
    pageSize: '16',
    viewType: 'list',
    entpNmAdd: '',
  })
}

export function parseSbizListPage(html: string): SbizListPage {
  const countMatch = html.match(/총<\/span>\s*<strong>\s*([\d,]+)\s*<\/strong>[\s\S]*?<strong>\s*\[(\d+)\/(\d+)\s*페이지\]/)
  const totalCount = countMatch ? toNumber(countMatch[1]) : 0
  const currentPage = countMatch ? toNumber(countMatch[2]) : 1
  const totalPages = countMatch ? toNumber(countMatch[3]) : 1
  const marketListHtml = html.match(/id=["']marketList["'][\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? ''
  const rowMatches = [...marketListHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]

  return {
    totalCount,
    currentPage,
    totalPages,
    rows: rowMatches.map((match) => parseTableRow(match[1])).filter((row): row is SbizListRow => row !== null),
  }
}

export function toPublicRestaurantRows(rows: SbizListRow[], geocodeCache: GeocodeCache): Restaurant[] {
  return rows.flatMap((row) => {
    const point = geocodeCache[row.address]
    if (!point) return []

    return [
      {
        id: row.id,
        name: row.name,
        category: row.category,
        region: extractRegion(row.address),
        address: row.address,
        lat: point.lat,
        lng: point.lng,
        ...(row.phone ? { phone: row.phone } : {}),
        sourceUrl: row.sourceUrl,
      },
    ]
  })
}

export function toRawRestaurantRows(rows: SbizListRow[]): RawRestaurant[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    region: extractRegion(row.address),
    address: row.address,
    ...(row.phone ? { phone: row.phone } : {}),
    sourceUrl: row.sourceUrl,
  }))
}

export function geocodeQueryVariants(address: string): string[] {
  const normalizedAddress = address.replace(/\s+/g, ' ').trim()
  const withoutParentheticals = normalizedAddress.replace(/\s*\([^)]*\)/g, '').trim()
  const parts = withoutParentheticals.split(/\s+/)
  const reordered = parts.length >= 4 ? `${parts.slice(1).join(' ')} ${parts[0]}` : withoutParentheticals

  return uniqueNonEmpty([normalizedAddress, withoutParentheticals, reordered])
}

function parseTableRow(rowHtml: string): SbizListRow | null {
  const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1])
  if (cells.length < 5) return null

  const linkHtml = cells[1]
  const id = linkHtml.match(/fn_goPage\('([^']+)'/)?.[1]
  const name = cleanText(linkHtml)
  const category = cleanText(cells[2])
  const phone = cleanText(cells[3])
  const address = cleanText(cells[4])

  if (!id || !name || !category || !address) return null

  return {
    id,
    name,
    category,
    ...(phone ? { phone } : {}),
    address,
    sourceUrl: `${SBIZ_DETAIL_URL}?rcpnNo=${encodeURIComponent(id)}`,
  }
}

function extractRegion(address: string): string {
  const parts = address.trim().split(/\s+/)
  return parts.slice(0, 2).join(' ')
}

function cleanText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#039;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function toNumber(value: string): number {
  return Number(value.replaceAll(',', ''))
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
