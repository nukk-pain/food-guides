import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { restaurantsDataUrl } from './data/restaurantsData'
import { copyableAddressText, buildMapLinks, normalizePhoneHref, safeSbizDetailUrl } from './domain/mapLinks'
import { filterRestaurantStores, type RawRestaurant, type Restaurant } from './domain/restaurants'
import { filterByArea, getAreaOptions, type AreaSelection, type ProvinceOption } from './domain/regions'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'
type MapScope = 'all' | AreaSelection | null

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [mapScope, setMapScope] = useState<MapScope>(null)
  const [activeProvince, setActiveProvince] = useState<string | null>(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
  const [copiedRestaurantId, setCopiedRestaurantId] = useState<string | null>(null)

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

  const searchFilteredRestaurants = useMemo(() => searchRestaurants(restaurants, query), [query, restaurants])

  const scopedRestaurants = useMemo(() => {
    if (mapScope === 'all') return restaurants
    return filterByArea(restaurants, mapScope)
  }, [mapScope, restaurants])

  const filteredRestaurants = useMemo(() => searchRestaurants(scopedRestaurants, query), [query, scopedRestaurants])

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
    setMapScope(selection)
    setActiveProvince(selection.province)
    setSelectedRestaurantId(null)
  }, [])

  const handleAllSelect = useCallback(() => {
    setMapScope('all')
    setSelectedRestaurantId(null)
  }, [])

  const handleChangeArea = useCallback(() => {
    setMapScope(null)
    setSelectedRestaurantId(null)
    setActiveProvince(mapScope && mapScope !== 'all' ? mapScope.province : activeProvince)
  }, [activeProvince, mapScope])

  const handleCopyAddress = useCallback(async (restaurant: Restaurant) => {
    const writeText = navigator.clipboard?.writeText
    if (typeof writeText !== 'function') {
      setCopiedRestaurantId(null)
      return
    }

    try {
      await writeText.call(navigator.clipboard, copyableAddressText(restaurant))
      setCopiedRestaurantId(restaurant.id)
    } catch {
      setCopiedRestaurantId(null)
    }
  }, [])

  const selectedAreaLabel = getScopeLabel(mapScope, query)

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <p className="eyebrow">전국 {restaurants.length.toLocaleString('ko-KR')}개 식당</p>
        <h1 id="page-title">백년가게 식당 지도</h1>
      </section>

      {loadState === 'loading' && <StatusCard title="데이터를 불러오는 중입니다" description="정적 JSON 파일을 읽고 있어요." />}
      {loadState === 'error' && (
        <StatusCard title="데이터를 불러오지 못했습니다" description="public/data/restaurants.json 파일을 확인해주세요." />
      )}
      {loadState === 'empty' && <StatusCard title="표시할 식당이 없습니다" description="음식점업과 좌표가 있는 데이터가 필요합니다." />}

      {loadState === 'ready' && !mapScope && (
        <RegionPicker
          allCount={searchFilteredRestaurants.length}
          areaOptions={areaOptions}
          activeProvince={activeProvince}
          activeProvinceOption={activeProvinceOption}
          query={query}
          searchResults={searchFilteredRestaurants}
          onQueryChange={setQuery}
          onProvinceSelect={handleProvinceSelect}
          onAreaSelect={handleAreaSelect}
          onAllSelect={handleAllSelect}
        />
      )}

      {loadState === 'ready' && mapScope && (
        <section className="content-grid" aria-label="백년가게 식당 지도와 목록">
          <div className="map-panel">
            <RestaurantMap restaurants={filteredRestaurants} selectedId={selectedRestaurant?.id} onSelect={handleSelect} />
            <div className="stats-card" aria-live="polite">
              <strong>{filteredRestaurants.length.toLocaleString('ko-KR')}</strong>
              <span>{selectedAreaLabel} 표시 중</span>
            </div>
          </div>
          <aside className="list-panel" aria-label="백년가게 식당 목록과 검색">
            <section className="toolbar" aria-label="검색">
              <div className="selected-area-row">
                <span>{selectedAreaLabel}</span>
                <button type="button" onClick={handleChangeArea}>
                  지역
                </button>
              </div>
              <SearchBox value={query} onChange={setQuery} label="검색" placeholder="상호·주소" />
            </section>
            {selectedRestaurant && (
              <SelectedRestaurantCard
                copied={copiedRestaurantId === selectedRestaurant.id}
                restaurant={selectedRestaurant}
                onCopyAddress={handleCopyAddress}
              />
            )}
            {filteredRestaurants.length === 0 ? (
              <p className="empty-list">검색 결과가 없습니다. 검색어를 줄이거나 지역을 다시 선택해보세요.</p>
            ) : (
              <ul className="restaurant-list">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantListItem
                    key={restaurant.id}
                    restaurant={restaurant}
                    selected={restaurant.id === selectedRestaurant?.id}
                    onSelect={handleSelect}
                  />
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
  allCount,
  areaOptions,
  activeProvince,
  activeProvinceOption,
  query,
  searchResults,
  onQueryChange,
  onProvinceSelect,
  onAreaSelect,
  onAllSelect,
}: {
  allCount: number
  areaOptions: ProvinceOption[]
  activeProvince: string | null
  activeProvinceOption: ProvinceOption | null
  query: string
  searchResults: Restaurant[]
  onQueryChange: (query: string) => void
  onProvinceSelect: (province: string) => void
  onAreaSelect: (selection: AreaSelection) => void
  onAllSelect: () => void
}) {
  const previewResults = query.trim() ? searchResults.slice(0, 6) : []

  return (
    <section className="region-panel" aria-labelledby="region-title">
      <div className="region-heading">
        <h2 id="region-title">지역 선택</h2>
      </div>

      <div className="landing-search-card">
        <SearchBox
          value={query}
          onChange={onQueryChange}
          label="검색"
          placeholder="상호·주소"
        />
        <button className="primary-action" type="button" onClick={onAllSelect}>
          전국 {allCount.toLocaleString('ko-KR')}개 식당
        </button>
      </div>

      {previewResults.length > 0 && (
        <div className="search-preview" aria-label="검색 미리보기">
          {previewResults.map((restaurant) => (
            <button key={restaurant.id} type="button" onClick={onAllSelect}>
              <strong>{restaurant.name}</strong>
              <span>{restaurant.region}</span>
            </button>
          ))}
        </div>
      )}

      <div className="province-grid" aria-label="시도 선택">
        {areaOptions.map((option) => (
          <button
            className={option.province === activeProvince ? 'province-button province-button--active' : 'province-button'}
            key={option.province}
            type="button"
            onClick={() => onProvinceSelect(option.province)}
          >
            <strong>{option.province}</strong>
            <span>{option.count.toLocaleString('ko-KR')}개</span>
          </button>
        ))}
      </div>

      {activeProvinceOption ? (
        <div className="county-panel" aria-label={`${activeProvinceOption.province} 시군구 선택`}>
          <button className="county-button county-button--primary" type="button" onClick={() => onAreaSelect({ province: activeProvinceOption.province })}>
            {activeProvinceOption.province} 전체
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
                <span>{option.count.toLocaleString('ko-KR')}개</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="region-hint">시·도 선택</p>
      )}
    </section>
  )
}

function SearchBox({
  value,
  label,
  placeholder,
  onChange,
}: {
  value: string
  label: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />
    </label>
  )
}

function SelectedRestaurantCard({
  copied,
  restaurant,
  onCopyAddress,
}: {
  copied: boolean
  restaurant: Restaurant
  onCopyAddress: (restaurant: Restaurant) => Promise<void>
}) {
  const phoneHref = normalizePhoneHref(restaurant.phone)
  const mapLinks = buildMapLinks(restaurant)
  const sourceUrl = safeSbizDetailUrl(restaurant.sourceUrl)

  return (
    <article className="selected-card">
      <h2>{restaurant.name}</h2>
      <p className="address-text">{restaurant.address}</p>
      <div className="action-row" aria-label="식당 바로가기">
        {phoneHref && (
          <a className="action-button action-button--primary" href={phoneHref}>
            전화하기
          </a>
        )}
        <button className="action-button" type="button" onClick={() => void onCopyAddress(restaurant)}>
          {copied ? '복사 완료' : '주소 복사'}
        </button>
      </div>
      <div className="map-link-row" aria-label="외부 지도에서 보기">
        <a href={mapLinks.naver} target="_blank" rel="noreferrer">
          네이버지도
        </a>
        <a href={mapLinks.kakao} target="_blank" rel="noreferrer">
          카카오맵
        </a>
        <a href={mapLinks.google} target="_blank" rel="noreferrer">
          구글맵
        </a>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            원문
          </a>
        )}
      </div>
    </article>
  )
}

function RestaurantListItem({
  restaurant,
  selected,
  onSelect,
}: {
  restaurant: Restaurant
  selected: boolean
  onSelect: (restaurant: Restaurant) => void
}) {
  return (
    <li>
      <button className={selected ? 'restaurant-list-button restaurant-list-button--selected' : 'restaurant-list-button'} type="button" onClick={() => onSelect(restaurant)}>
        <strong>{restaurant.name}</strong>
        <span>{restaurant.region}</span>
        <small>{restaurant.address}</small>
      </button>
    </li>
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

function searchRestaurants(restaurants: Restaurant[], query: string): Restaurant[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
  if (!normalizedQuery) return restaurants

  return restaurants.filter((restaurant) => {
    const haystack = [restaurant.name, restaurant.region, restaurant.address, restaurant.category]
      .join(' ')
      .toLocaleLowerCase('ko-KR')
    return haystack.includes(normalizedQuery)
  })
}

function getScopeLabel(scope: MapScope, query: string): string {
  if (scope === 'all') return query.trim() ? '전국 검색 결과' : '전국'
  if (!scope) return ''
  return `${scope.province}${scope.county ? ` ${scope.county}` : ' 전체'}`
}

export default App
