import { describe, expect, it } from 'vitest'
import { filterRestaurantStores, normalizeRestaurant } from './restaurants'

describe('restaurant domain helpers', () => {
  it('keeps only 백년가게 entries that look like restaurant businesses and have coordinates', () => {
    const input = [
      {
        id: '1',
        name: '한식명가',
        category: '음식점업',
        region: '서울특별시 종로구',
        address: '서울 종로구 테스트로 1',
        lat: 37.573,
        lng: 126.979,
      },
      {
        id: '2',
        name: '제조명가',
        category: '제조업',
        region: '서울특별시 중구',
        address: '서울 중구 테스트로 2',
        lat: 37.56,
        lng: 126.99,
      },
      {
        id: '3',
        name: '좌표없는식당',
        category: '음식점업',
        region: '부산광역시 중구',
        address: '부산 중구 테스트로 3',
      },
    ]

    expect(filterRestaurantStores(input)).toEqual([input[0]])
  })

  it('normalizes raw source rows into the app data contract', () => {
    const row = {
      id: '100',
      name: '원조국밥',
      category: '한식 음식점업',
      region: '부산광역시 해운대구',
      address: '부산 해운대구 달맞이길 1',
      lat: '35.1587',
      lng: '129.1604',
      phone: '051-000-0000',
      sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketList.do',
    }

    expect(normalizeRestaurant(row)).toEqual({
      id: '100',
      name: '원조국밥',
      category: '한식 음식점업',
      region: '부산광역시 해운대구',
      address: '부산 해운대구 달맞이길 1',
      lat: 35.1587,
      lng: 129.1604,
      phone: '051-000-0000',
      sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketList.do',
    })
  })
})
