import { describe, expect, it } from 'vitest'
import { buildKakaoAddressUrl, parseKakaoAddressResponse } from './kakaoGeocoder'

describe('Kakao Local address geocoder helpers', () => {
  it('builds an address search URL with one JSON result', () => {
    const url = buildKakaoAddressUrl('서울특별시 종로구 세종대로 1')

    expect(url.toString()).toContain('https://dapi.kakao.com/v2/local/search/address.json')
    expect(url.searchParams.get('query')).toBe('서울특별시 종로구 세종대로 1')
    expect(url.searchParams.get('size')).toBe('1')
    expect(url.searchParams.get('page')).toBe('1')
  })

  it('parses Kakao x/y coordinates into app lat/lng order', () => {
    expect(
      parseKakaoAddressResponse({
        documents: [{ x: '126.978', y: '37.5665', address_name: '서울특별시 중구 세종대로 110' }],
      }),
    ).toEqual({ lat: 37.5665, lng: 126.978 })
  })

  it('returns null when the API has no usable Korean WGS84 coordinate', () => {
    expect(parseKakaoAddressResponse({ documents: [] })).toBeNull()
    expect(parseKakaoAddressResponse({ documents: [{ x: '-74.0', y: '40.7' }] })).toBeNull()
  })
})
