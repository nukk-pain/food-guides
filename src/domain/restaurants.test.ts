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

  it('normalizes city-name aliases to official metropolitan addresses', () => {
    expect(
      normalizeRestaurant({
        id: 'HND003136',
        name: '청평매운탕',
        category: '음식점업',
        region: '서울시 중랑구',
        address: '서울시 중랑구 공릉로 46, 1층(묵동)',
        lat: 37.613,
        lng: 127.078,
      }),
    ).toMatchObject({
      region: '서울특별시 중랑구',
      address: '서울특별시 중랑구 공릉로 46, 1층(묵동)',
    })

    expect(
      normalizeRestaurant({
        id: '20240060806',
        name: '해금강',
        category: '음식점업',
        region: '대구시 동구',
        address: '대구시 동구 신암남로 133. 1,2층',
        lat: 35.88,
        lng: 128.62,
      }),
    ).toMatchObject({
      region: '대구광역시 동구',
      address: '대구광역시 동구 신암남로 133. 1,2층',
    })
  })
})
