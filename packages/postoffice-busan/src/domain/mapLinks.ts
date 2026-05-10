type RestaurantLinkInput = {
  name: string
  address: string
}

export type MapLinks = {
  naver: string
  kakao: string
  google: string
}

export function buildMapLinks(restaurant: RestaurantLinkInput): MapLinks {
  const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`)
  return {
    naver: `https://map.naver.com/p/search/${query}`,
    kakao: `https://map.kakao.com/link/search/${query}`,
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
  }
}

/**
 * Google web (not maps) search URL pre-filled with `name + 시·도 + 시·군·구`,
 * so users can disambiguate between same-named branches across the country
 * (e.g. "함흥냉면" → "함흥냉면 부산광역시 동래구").
 */
export function buildGoogleSearchUrl(restaurant: RestaurantLinkInput): string {
  const tokens = restaurant.address.split(/\s+/)
  const locality = tokens.slice(0, 2).join(' ')
  const q = `${restaurant.name} ${locality}`.trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export function normalizePhoneHref(phone?: string): string | null {
  if (!phone) return null
  // strip non-digits but preserve only the leading phone (drop "(memo)" suffix)
  const phoneOnly = phone.replace(/\s*\(.+$/, '').trim()
  const digits = phoneOnly.replace(/\D/g, '')
  if (!digits) return null
  return `tel:${digits}`
}

export function copyableAddressText(restaurant: RestaurantLinkInput): string {
  return `${restaurant.name}\n${restaurant.address}`
}
