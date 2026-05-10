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
