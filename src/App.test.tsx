/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/RestaurantMap', () => ({
  RestaurantMap: ({ restaurants, onSelect }: { restaurants: typeof sampleRestaurants; onSelect: (restaurant: (typeof sampleRestaurants)[number]) => void }) => (
    <div data-testid="restaurant-map">
      {restaurants.map((restaurant) => (
        <button key={restaurant.id} type="button" onClick={() => onSelect(restaurant)}>
          {restaurant.name}
        </button>
      ))}
    </div>
  ),
}))

const sampleRestaurants = [
  {
    id: '1',
    name: '고령금산한우',
    category: '음식점업',
    region: '경북 고령군',
    address: '경상북도 고령군 성산면 성산로 946-5',
    lat: 35.75,
    lng: 128.26,
    phone: '0549564484',
    sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=1',
  },
  {
    id: '2',
    name: '서울국밥',
    category: '음식점업',
    region: '서울 종로구',
    address: '서울특별시 종로구 종로 1',
    lat: 37.57,
    lng: 126.98,
    phone: '021234567',
    sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=2',
  },
]

describe('App UX flow', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => sampleRestaurants,
      })),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('starts with a focused landing screen and a nationwide map action', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: '백년가게 식당 지도' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /전체 식당 지도 보기.*2개/ })).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: /검색/ })).toBeTruthy()
    expect(document.body.textContent).not.toContain('상호명이나 주소로 검색하고, 지역을 고르면 바로 지도로 확인할 수 있어요.')
    expect(document.body.textContent).not.toContain('지역별 노포 탐색')
    expect(document.body.textContent).not.toContain('검색 → 지역 선택 → 지도 팝업')
    expect(document.body.textContent).not.toContain('지도와 목록으로 찾기')
    expect(document.body.textContent).not.toContain('인증된 오래된 식당')
    expect(document.body.textContent).not.toContain('곳')
  })

  it('lets users search before choosing a region and open the matching area', async () => {
    render(<App />)

    const searchBox = await screen.findByRole('searchbox', { name: /검색/ })
    fireEvent.change(searchBox, { target: { value: '서울' } })

    expect(screen.getByText('서울국밥')).toBeTruthy()
    expect(screen.queryByText('고령금산한우')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /검색 결과 지도 보기.*1개/ }))

    await screen.findByTestId('restaurant-map')
    expect(screen.queryByText('서울 종로구')).toBeNull()
    expect(document.body.textContent).not.toContain('표시 중')
    expect(document.body.textContent).not.toContain('곳')

    fireEvent.click(screen.getByRole('button', { name: '서울국밥' }))

    const detailCard = screen.getByText('서울특별시 종로구 종로 1').closest('.map-detail-card')
    expect(detailCard).toBeTruthy()
    expect(detailCard?.previousElementSibling?.classList.contains('map-panel')).toBe(true)
    await waitFor(() => expect(screen.getByRole('link', { name: '전화하기' }).getAttribute('href')).toBe('tel:021234567'))
  })

  it('uses province and county dropdowns before opening the map', async () => {
    render(<App />)

    const provinceSelect = await screen.findByRole('combobox', { name: '시·도' })
    fireEvent.change(provinceSelect, { target: { value: '서울' } })

    const countySelect = screen.getByRole('combobox', { name: '시·군·구' })
    fireEvent.change(countySelect, { target: { value: '종로구' } })
    fireEvent.click(screen.getByRole('button', { name: '선택 지역 지도 보기' }))

    await screen.findByTestId('restaurant-map')
    expect(document.body.textContent).not.toContain('표시 중')
    expect(screen.queryByText('서울특별시 종로구 종로 1')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '서울국밥' }))

    expect(screen.getByText('서울특별시 종로구 종로 1')).toBeTruthy()
  })
})
