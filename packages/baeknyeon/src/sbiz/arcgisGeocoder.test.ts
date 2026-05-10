import { describe, expect, it } from 'vitest'
import { buildArcGisAddressUrl, parseArcGisAddressResponse } from './arcgisGeocoder'

describe('ArcGIS address geocoder helpers', () => {
  it('builds a findAddressCandidates URL with one WGS84 JSON result', () => {
    const url = buildArcGisAddressUrl('경기도 군포시 번영로 508')

    expect(url.toString()).toContain(
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates',
    )
    expect(url.searchParams.get('SingleLine')).toBe('경기도 군포시 번영로 508')
    expect(url.searchParams.get('f')).toBe('json')
    expect(url.searchParams.get('maxLocations')).toBe('1')
    expect(url.searchParams.get('outSR')).toBe('4326')
  })

  it('parses ArcGIS x/y coordinates into app lat/lng order', () => {
    expect(
      parseArcGisAddressResponse({
        candidates: [
          {
            address: '경기도 군포시 금정동 번영로 508',
            location: { x: 126.933892, y: 37.357923 },
          },
        ],
      }),
    ).toEqual({ lat: 37.357923, lng: 126.933892 })
  })

  it('returns null when the API has no usable Korean WGS84 coordinate', () => {
    expect(parseArcGisAddressResponse({ candidates: [] })).toBeNull()
    expect(parseArcGisAddressResponse({ candidates: [{ location: { x: -74.0, y: 40.7 } }] })).toBeNull()
  })
})
