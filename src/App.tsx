import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { restaurantsDataUrl } from './data/restaurantsData'
import { filterRestaurantStores, type RawRestaurant, type Restaurant } from './domain/restaurants'
import { filterByArea, getAreaOptions, type AreaSelection, type ProvinceOption } from './domain/regions'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [areaSelection, setAreaSelection] = useState<AreaSelection | null>(null)
  const [activeProvince, setActiveProvince] = useState<string | null>(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRestaurants() {
      try {
        const response = await fetch(restaurantsDataUrl())
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const rawRows = (await response.json()) as RawRestaurant[]
        const restaurantRows = filterRestaurantStores(rawRows)

        if (cancelled) return
        setRestaurants(restaurantRows)
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

  const areaOptions = useMemo(() => getAreaOptions(restaurants), [restaurants])
  const activeProvinceOption = useMemo(
    () => areaOptions.find((option) => option.province === activeProvince) ?? null,
    [activeProvince, areaOptions],
  )

  const areaRestaurants = useMemo(() => filterByArea(restaurants, areaSelection), [areaSelection, restaurants])

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
    if (!normalizedQuery) return areaRestaurants

    return areaRestaurants.filter((restaurant) => {
      const haystack = [restaurant.name, restaurant.region, restaurant.address, restaurant.category]
        .join(' ')
        .toLocaleLowerCase('ko-KR')
      return haystack.includes(normalizedQuery)
    })
  }, [query, areaRestaurants])

  const selectedRestaurant = useMemo(
    () => filteredRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? filteredRestaurants[0] ?? null,
    [filteredRestaurants, selectedRestaurantId],
  )

  const handleSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id)
  }, [])

  const handleProvinceSelect = useCallback((province: string) => {
    setActiveProvince(province)
  }, [])

  const handleAreaSelect = useCallback((selection: AreaSelection) => {
    setAreaSelection(selection)
    setActiveProvince(selection.province)
    setSelectedRestaurantId(null)
    setQuery('')
  }, [])

  const handleChangeArea = useCallback(() => {
    setAreaSelection(null)
    setSelectedRestaurantId(null)
    setQuery('')
    setActiveProvince(areaSelection?.province ?? activeProvince)
  }, [activeProvince, areaSelection])

  const selectedAreaLabel = areaSelection
    ? `${areaSelection.province}${areaSelection.county ? ` ${areaSelection.county}` : ' 전체'}`
    : ''

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <p className="eyebrow">0원 운영을 목표로 하는 정적 지도 서비스</p>
        <h1 id="page-title">백년가게 식당 지도</h1>
        <p className="hero-copy">
          소상공인시장진흥공단 백년가게 목록에서 음식점업만 추려, 먼저 지역을 고른 뒤 지도에서 빠르게 찾는 서비스입니다.
        </p>
      </section>

      {loadState === 'loading' && <StatusCard title="데이터를 불러오는 중입니다" description="정적 JSON 파일을 읽고 있어요." />}
      {loadState === 'error' && (
        <StatusCard title="데이터를 불러오지 못했습니다" description="public/data/restaurants.json 파일을 확인해주세요." />
      )}
      {loadState === 'empty' && <StatusCard title="표시할 식당이 없습니다" description="음식점업과 좌표가 있는 데이터가 필요합니다." />}

      {loadState === 'ready' && !areaSelection && (
        <RegionPicker
          areaOptions={areaOptions}
          activeProvince={activeProvince}
          activeProvinceOption={activeProvinceOption}
          onProvinceSelect={handleProvinceSelect}
          onAreaSelect={handleAreaSelect}
        />
      )}

      {loadState === 'ready' && areaSelection && (
        <section className="content-grid" aria-label="백년가게 식당 지도와 목록">
          <div className="map-panel">
            <RestaurantMap restaurants={filteredRestaurants} selectedId={selectedRestaurant?.id} onSelect={handleSelect} />
            <div className="stats-card" aria-live="polite">
              <strong>{filteredRestaurants.length.toLocaleString('ko-KR')}</strong>
              <span>{selectedAreaLabel} 표시 중</span>
            </div>
          </div>
          <aside className="list-panel" aria-label="백년가게 식당 목록과 검색">
            <section className="toolbar" aria-label="식당 검색">
              <div className="selected-area-row">
                <span>{selectedAreaLabel}</span>
                <button type="button" onClick={handleChangeArea}>
                  지역 변경
                </button>
              </div>
              <label className="search-box">
                <span>상호·주소 검색</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="예: 국밥, 한식, 도로명"
                  type="search"
                />
              </label>
            </section>
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
            {filteredRestaurants.length === 0 ? (
              <p className="empty-list">검색 결과가 없습니다. 검색어를 줄이거나 지역을 다시 선택해보세요.</p>
            ) : (
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
            )}
          </aside>
        </section>
      )}
    </main>
  )
}

function RegionPicker({
  areaOptions,
  activeProvince,
  activeProvinceOption,
  onProvinceSelect,
  onAreaSelect,
}: {
  areaOptions: ProvinceOption[]
  activeProvince: string | null
  activeProvinceOption: ProvinceOption | null
  onProvinceSelect: (province: string) => void
  onAreaSelect: (selection: AreaSelection) => void
}) {
  return (
    <section className="region-panel" aria-labelledby="region-title">
      <div className="region-heading">
        <p className="eyebrow">지역 먼저 선택</p>
        <h2 id="region-title">어느 지역의 백년가게 식당을 볼까요?</h2>
        <p>SBIZ 화면처럼 시·도를 먼저 고르고, 필요하면 시·군·구까지 좁힌 뒤 지도를 엽니다.</p>
      </div>

      <div className="province-grid" aria-label="시도 선택">
        {areaOptions.map((option) => (
          <button
            className={option.province === activeProvince ? 'province-button province-button--active' : 'province-button'}
            key={option.province}
            type="button"
            onClick={() => onProvinceSelect(option.province)}
          >
            <strong>{option.province}</strong>
            <span>{option.count.toLocaleString('ko-KR')}곳</span>
          </button>
        ))}
      </div>

      {activeProvinceOption ? (
        <div className="county-panel" aria-label={`${activeProvinceOption.province} 시군구 선택`}>
          <button className="county-button county-button--primary" type="button" onClick={() => onAreaSelect({ province: activeProvinceOption.province })}>
            {activeProvinceOption.province} 전체 지도 보기
          </button>
          <div className="county-grid">
            {activeProvinceOption.counties.map((option) => (
              <button
                className="county-button"
                key={option.county}
                type="button"
                onClick={() => onAreaSelect({ province: activeProvinceOption.province, county: option.county })}
              >
                <strong>{option.county}</strong>
                <span>{option.count.toLocaleString('ko-KR')}곳</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="region-hint">시·도를 선택하면 시·군·구 목록이 나타납니다.</p>
      )}
    </section>
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
