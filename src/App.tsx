import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { filterRestaurantStores, type RawRestaurant, type Restaurant } from './domain/restaurants'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRestaurants() {
      try {
        const response = await fetch('/data/restaurants.json')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const rawRows = (await response.json()) as RawRestaurant[]
        const restaurantRows = filterRestaurantStores(rawRows)

        if (cancelled) return
        setRestaurants(restaurantRows)
        setSelectedRestaurant(restaurantRows[0] ?? null)
        setLoadState(restaurantRows.length > 0 ? 'ready' : 'empty')
      } catch (error) {
        console.error('Failed to load restaurant data', error)
        if (!cancelled) setLoadState('error')
      }
    }

    loadRestaurants()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
    if (!normalizedQuery) return restaurants

    return restaurants.filter((restaurant) => {
      const haystack = [restaurant.name, restaurant.region, restaurant.address, restaurant.category]
        .join(' ')
        .toLocaleLowerCase('ko-KR')
      return haystack.includes(normalizedQuery)
    })
  }, [query, restaurants])

  const handleSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }, [])

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <p className="eyebrow">0원 운영을 목표로 하는 정적 지도 서비스</p>
        <h1 id="page-title">백년가게 식당 지도</h1>
        <p className="hero-copy">
          소상공인시장진흥공단 백년가게 목록에서 음식점업만 추려 지도에서 빠르게 찾는 서비스입니다.
        </p>
      </section>

      <section className="toolbar" aria-label="식당 검색과 현황">
        <label className="search-box">
          <span>지역·상호 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 서울, 국밥, 한식"
            type="search"
          />
        </label>
        <div className="stats-card">
          <strong>{filteredRestaurants.length.toLocaleString('ko-KR')}</strong>
          <span>개 식당 표시 중</span>
        </div>
      </section>

      {loadState === 'loading' && <StatusCard title="데이터를 불러오는 중입니다" description="정적 JSON 파일을 읽고 있어요." />}
      {loadState === 'error' && (
        <StatusCard title="데이터를 불러오지 못했습니다" description="public/data/restaurants.json 파일을 확인해주세요." />
      )}
      {loadState === 'empty' && <StatusCard title="표시할 식당이 없습니다" description="음식점업과 좌표가 있는 데이터가 필요합니다." />}

      {loadState === 'ready' && (
        <section className="content-grid">
          <RestaurantMap restaurants={filteredRestaurants} selectedId={selectedRestaurant?.id} onSelect={handleSelect} />
          <aside className="list-panel" aria-label="백년가게 식당 목록">
            {selectedRestaurant && (
              <article className="selected-card">
                <p className="eyebrow">선택한 식당</p>
                <h2>{selectedRestaurant.name}</h2>
                <p>{selectedRestaurant.address}</p>
                <dl>
                  <div>
                    <dt>업종</dt>
                    <dd>{selectedRestaurant.category}</dd>
                  </div>
                  <div>
                    <dt>지역</dt>
                    <dd>{selectedRestaurant.region}</dd>
                  </div>
                  {selectedRestaurant.phone && (
                    <div>
                      <dt>전화</dt>
                      <dd>{selectedRestaurant.phone}</dd>
                    </div>
                  )}
                </dl>
              </article>
            )}
            <ul className="restaurant-list">
              {filteredRestaurants.map((restaurant) => (
                <li key={restaurant.id}>
                  <button type="button" onClick={() => handleSelect(restaurant)}>
                    <strong>{restaurant.name}</strong>
                    <span>{restaurant.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      )}
    </main>
  )
}

function StatusCard({ title, description }: { title: string; description: string }) {
  return (
    <section className="status-card" role="status">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}

export default App
