// Re-export shared map/contact helpers + sbiz-specific source URL guard.

export {
  buildMapLinks,
  buildGoogleSearchUrl,
  copyableAddressText,
  normalizePhoneHref,
} from '@food-guides/shared/mapLinks'
export type { MapLinks } from '@food-guides/shared/mapLinks'

/**
 * Validate that a sourceUrl points to the canonical sbiz detail page —
 * a baeknyeon-only concern. Other guides don't have an `sourceUrl` field.
 */
export function safeSbizDetailUrl(sourceUrl?: string): string | null {
  if (!sourceUrl) return null

  try {
    const url = new URL(sourceUrl)
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    const isSbizHost = url.host === 'www.sbiz.or.kr'
    const isDetailPath = url.pathname === '/hdst/main/ohndMarketDetail.do'
    const hasNoCredentials = !url.username && !url.password

    return isHttp && isSbizHost && isDetailPath && hasNoCredentials ? url.href : null
  } catch {
    return null
  }
}
