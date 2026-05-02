import { describe, expect, it } from 'vitest'
import type { Restaurant } from './restaurants'
import { filterByArea, getAreaOptions, getProvinceLabel } from './regions'

const rows: Restaurant[] = [
  restaurant('1', '서울식당', '서울특별시 종로구 세종대로 1'),
  restaurant('2', '강남식당', '서울특별시 강남구 테헤란로 1'),
  restaurant('3', '부산식당', '부산광역시 해운대구 달맞이길 1'),
  restaurant('4', '군포식당', '경기도 군포시 번영로 1'),
]

describe('region helpers', () => {
  it('normalizes source addresses into SBIZ-style province labels', () => {
    expect(getProvinceLabel('서울특별시 종로구 세종대로 1')).toBe('서울')
    expect(getProvinceLabel('서울시 중랑구 공릉로 46, 1층(묵동)')).toBe('서울')
    expect(getProvinceLabel('대구시 동구 신암남로 133. 1,2층')).toBe('대구')
    expect(getProvinceLabel('경기도 군포시 번영로 1')).toBe('경기')
    expect(getProvinceLabel('세종특별자치시 조치원읍 새내로 1')).toBe('세종')
  })

  it('builds province and county options from restaurants in display order', () => {
    expect(getAreaOptions(rows)).toEqual([
      { province: '서울', count: 2, counties: [{ county: '강남구', count: 1 }, { county: '종로구', count: 1 }] },
      { province: '부산', count: 1, counties: [{ county: '해운대구', count: 1 }] },
      { province: '경기', count: 1, counties: [{ county: '군포시', count: 1 }] },
    ])
  })

  it('filters restaurants by selected province and optional county', () => {
    expect(filterByArea(rows, { province: '서울' }).map((row) => row.id)).toEqual(['1', '2'])
    expect(filterByArea(rows, { province: '서울', county: '종로구' }).map((row) => row.id)).toEqual(['1'])
    expect(filterByArea(rows, null)).toEqual([])
  })
})

function restaurant(id: string, name: string, address: string): Restaurant {
  const [province, county] = address.split(/\s+/)
  return {
    id,
    name,
    category: '음식점업',
    region: `${province} ${county}`,
    address,
    lat: 37,
    lng: 127,
  }
}
