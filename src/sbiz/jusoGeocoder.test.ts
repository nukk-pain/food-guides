import { describe, expect, it } from 'vitest'
import { buildJusoCoordUrl, buildJusoSearchUrl, parseJusoCoordResponse, parseJusoSearchResponse } from './jusoGeocoder'

describe('Juso public road-address geocoder helpers', () => {
  it('builds the road-name address search URL with the confirmation key and keyword', () => {
    const url = buildJusoSearchUrl('서울특별시 종로구 세종대로 1', 'test-key')

    expect(url.toString()).toContain('https://business.juso.go.kr/addrlink/addrLinkApi.do')
    expect(url.searchParams.get('confmKey')).toBe('test-key')
    expect(url.searchParams.get('keyword')).toBe('서울특별시 종로구 세종대로 1')
    expect(url.searchParams.get('resultType')).toBe('json')
  })

  it('extracts the coordinate lookup keys from the first successful address search result', () => {
    expect(
      parseJusoSearchResponse({
        results: {
          common: { errorCode: '0' },
          juso: [
            {
              admCd: '1111010100',
              rnMgtSn: '111103100001',
              udrtYn: '0',
              buldMnnm: '1',
              buldSlno: '0',
            },
          ],
        },
      }),
    ).toEqual({ admCd: '1111010100', rnMgtSn: '111103100001', udrtYn: '0', buldMnnm: '1', buldSlno: '0' })
  })

  it('builds the coordinate URL from address lookup keys', () => {
    const url = buildJusoCoordUrl(
      { admCd: '1111010100', rnMgtSn: '111103100001', udrtYn: '0', buldMnnm: '1', buldSlno: '0' },
      'test-key',
    )

    expect(url.toString()).toContain('https://business.juso.go.kr/addrlink/addrCoordApi.do')
    expect(url.searchParams.get('admCd')).toBe('1111010100')
    expect(url.searchParams.get('rnMgtSn')).toBe('111103100001')
    expect(url.searchParams.get('resultType')).toBe('json')
  })

  it('parses WGS84 x/y coordinates into app lat/lng order', () => {
    expect(
      parseJusoCoordResponse({
        results: {
          common: { errorCode: '0' },
          juso: [{ entX: '126.978', entY: '37.5665' }],
        },
      }),
    ).toEqual({ lat: 37.5665, lng: 126.978 })
  })
})
