/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/RestaurantMap', () => ({
  RestaurantMap: ({ restaurants }: { restaurants: unknown[] }) => <div data-testid="restaurant-map">지도 {restaurants.length}곳</div>,
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

  it('starts with a search-friendly landing screen and a nationwide map action', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: '백년가게 식당 찾기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /전국 2곳 지도 보기/ })).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: /지역·상호·주소 검색/ })).toBeTruthy()
  })

  it('lets users search before choosing a region and open the matching area', async () => {
    render(<App />)

    const searchBox = await screen.findByRole('searchbox', { name: /지역·상호·주소 검색/ })
    fireEvent.change(searchBox, { target: { value: '서울' } })

    expect(screen.getByText('서울국밥')).toBeTruthy()
    expect(screen.queryByText('고령금산한우')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /전국 1곳 지도 보기/ }))

    expect((await screen.findByTestId('restaurant-map')).textContent).toBe('지도 1곳')
    await waitFor(() => expect(screen.getByRole('link', { name: '전화하기' }).getAttribute('href')).toBe('tel:021234567'))
  })
})
