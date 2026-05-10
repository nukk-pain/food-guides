/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('@food-guides/shared', async () => {
  const actual = await vi.importActual<typeof import('@food-guides/shared')>('@food-guides/shared')
  return {
    ...actual,
    RestaurantMap: ({
      restaurants,
      onSelect,
    }: {
      restaurants: typeof sampleRestaurants
      onSelect: (restaurant: (typeof sampleRestaurants)[number]) => void
    }) => (
      <div data-testid="restaurant-map">
        {restaurants.map((restaurant) => (
          <button key={restaurant.id} type="button" onClick={() => onSelect(restaurant)}>
            {restaurant.name}
          </button>
        ))}
      </div>
    ),
  }
})

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

describe('App UX flow (picker + map shown together)', () => {
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

  it('renders header, picker, and map together on first load', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: '백년가게 식당 지도' })).toBeTruthy()
    expect(screen.getByText('전국 백년가게 음식점 2곳')).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: /검색/ })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /시·도/ })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /시·군·구/ })).toBeTruthy()
    expect(screen.getByTestId('restaurant-map')).toBeTruthy()
    // both restaurants visible by default
    expect(screen.getByText('고령금산한우')).toBeTruthy()
    expect(screen.getByText('서울국밥')).toBeTruthy()
  })

  it('filters markers as the search query changes', async () => {
    render(<App />)
    await screen.findByTestId('restaurant-map')
    fireEvent.change(screen.getByRole('searchbox', { name: /검색/ }), { target: { value: '서울' } })
    expect(screen.getByText('서울국밥')).toBeTruthy()
    expect(screen.queryByText('고령금산한우')).toBeNull()
  })

  it('filters markers via province dropdown without a confirm button', async () => {
    render(<App />)
    await screen.findByTestId('restaurant-map')
    fireEvent.change(screen.getByRole('combobox', { name: /시·도/ }), { target: { value: '서울' } })
    expect(screen.queryByText('고령금산한우')).toBeNull()
    expect(screen.getByText('서울국밥')).toBeTruthy()
  })

  it('opens a detail card when a marker is selected', async () => {
    render(<App />)
    await screen.findByTestId('restaurant-map')
    fireEvent.click(screen.getByRole('button', { name: '서울국밥' }))
    expect(screen.getByText('서울특별시 종로구 종로 1')).toBeTruthy()
    const phoneLink = screen.getByRole('link', { name: '전화하기' })
    expect(phoneLink.getAttribute('href')).toBe('tel:021234567')
    // 외부 지도 + sbiz 원문 링크가 모두 노출
    expect(screen.getByRole('link', { name: '네이버지도' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '원문' })).toBeTruthy()
  })

  it('clears filters back to the full set via the 초기화 button', async () => {
    render(<App />)
    await screen.findByTestId('restaurant-map')
    fireEvent.change(screen.getByRole('searchbox', { name: /검색/ }), { target: { value: '서울' } })
    expect(screen.queryByText('고령금산한우')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))
    expect(screen.getByText('고령금산한우')).toBeTruthy()
    expect(screen.getByText('서울국밥')).toBeTruthy()
  })
})
