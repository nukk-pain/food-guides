import { describe, expect, it } from 'vitest'
import { buildMapLinks, copyableAddressText, normalizePhoneHref } from '@food-guides/shared/mapLinks'
import { safeSbizDetailUrl } from './mapLinks'

describe('restaurant action link helpers', () => {
  it('builds external map search links from restaurant name and address', () => {
    const links = buildMapLinks({ name: '고령금산한우', address: '경상북도 고령군 성산면 성산로 946-5' })

    expect(links.naver).toBe(
      'https://map.naver.com/p/search/%EA%B3%A0%EB%A0%B9%EA%B8%88%EC%82%B0%ED%95%9C%EC%9A%B0%20%EA%B2%BD%EC%83%81%EB%B6%81%EB%8F%84%20%EA%B3%A0%EB%A0%B9%EA%B5%B0%20%EC%84%B1%EC%82%B0%EB%A9%B4%20%EC%84%B1%EC%82%B0%EB%A1%9C%20946-5',
    )
    expect(links.kakao).toBe(
      'https://map.kakao.com/link/search/%EA%B3%A0%EB%A0%B9%EA%B8%88%EC%82%B0%ED%95%9C%EC%9A%B0%20%EA%B2%BD%EC%83%81%EB%B6%81%EB%8F%84%20%EA%B3%A0%EB%A0%B9%EA%B5%B0%20%EC%84%B1%EC%82%B0%EB%A9%B4%20%EC%84%B1%EC%82%B0%EB%A1%9C%20946-5',
    )
    expect(links.google).toBe(
      'https://www.google.com/maps/search/?api=1&query=%EA%B3%A0%EB%A0%B9%EA%B8%88%EC%82%B0%ED%95%9C%EC%9A%B0%20%EA%B2%BD%EC%83%81%EB%B6%81%EB%8F%84%20%EA%B3%A0%EB%A0%B9%EA%B5%B0%20%EC%84%B1%EC%82%B0%EB%A9%B4%20%EC%84%B1%EC%82%B0%EB%A1%9C%20946-5',
    )
  })

  it('normalizes phone numbers into tel links', () => {
    expect(normalizePhoneHref('054-956-4484')).toBe('tel:0549564484')
    expect(normalizePhoneHref('02 123 4567')).toBe('tel:021234567')
    expect(normalizePhoneHref(undefined)).toBeNull()
  })

  it('creates readable address text for clipboard copy', () => {
    expect(copyableAddressText({ name: '고령금산한우', address: '경상북도 고령군 성산면 성산로 946-5' })).toBe(
      '고령금산한우\n경상북도 고령군 성산면 성산로 946-5',
    )
  })

  it('allows only SBIZ http(s) detail source URLs', () => {
    const safeUrl = 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799'

    expect(safeSbizDetailUrl(safeUrl)).toBe(safeUrl)
    expect(safeSbizDetailUrl('http://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799')).toBe(
      'http://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799',
    )
    expect(safeSbizDetailUrl('javascript:alert(1)')).toBeNull()
    expect(safeSbizDetailUrl('https://evil.example/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799')).toBeNull()
    expect(safeSbizDetailUrl('https://www.sbiz.or.kr/hdst/main/ohndMarketList.do')).toBeNull()
  })
})
