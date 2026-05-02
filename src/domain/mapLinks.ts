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

  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  return `tel:${digits}`
}

export function copyableAddressText(restaurant: RestaurantLinkInput): string {
  return `${restaurant.name}\n${restaurant.address}`
}

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
