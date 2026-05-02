import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { restaurantsDataUrl } from './data/restaurantsData'
import { copyableAddressText, buildMapLinks, normalizePhoneHref, safeSbizDetailUrl } from './domain/mapLinks'
import { filterRestaurantStores, type RawRestaurant, type Restaurant } from './domain/restaurants'
import {
  filterByArea,
  getAreaOptions,
  getCountyLabel,
  getProvinceLabel,
  type AreaSelection,
  type ProvinceOption,
} from './domain/regions'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'
type MapScope = 'all' | AreaSelection | null

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [mapScope, setMapScope] = useState<MapScope>(null)
  const [activeProvince, setActiveProvince] = useState<string | null>(null)
  const [activeCounty, setActiveCounty] = useState('')
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
    () => filteredRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [filteredRestaurants, selectedRestaurantId],
  )

  const handleSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id)
  }, [])

  const handleProvinceSelect = useCallback((province: string) => {
    setActiveProvince(province || null)
    setActiveCounty('')
  }, [])

  const handleCountySelect = useCallback((county: string) => {
    setActiveCounty(county)
  }, [])

  const handleAreaSelect = useCallback((selection: AreaSelection) => {
    setMapScope(selection)
    setActiveProvince(selection.province)
    setActiveCounty(selection.county ?? '')
    setSelectedRestaurantId(null)
  }, [])

  const handleSelectedAreaOpen = useCallback(() => {
    if (!activeProvince) return
    handleAreaSelect({ province: activeProvince, ...(activeCounty ? { county: activeCounty } : {}) })
  }, [activeCounty, activeProvince, handleAreaSelect])

  const handleAllSelect = useCallback(() => {
    setMapScope('all')
    setSelectedRestaurantId(null)
  }, [])

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

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <p className="eyebrow">전국 {restaurants.length.toLocaleString('ko-KR')}개 식당</p>
        <h1 id="page-title">백년가게 식당 지도</h1>
        <p className="hero-description">전국 백년가게 식당을 검색하고 지도에서 확인하세요.</p>
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
          activeCounty={activeCounty}
          activeProvinceOption={activeProvinceOption}
          query={query}
          searchResults={searchFilteredRestaurants}
          onQueryChange={setQuery}
          onProvinceSelect={handleProvinceSelect}
          onCountySelect={handleCountySelect}
          onAreaOpen={handleSelectedAreaOpen}
          onAllSelect={handleAllSelect}
        />
      )}

      {loadState === 'ready' && mapScope && (
        <section className="content-grid" aria-label="백년가게 식당 지도">
          <div className="map-panel">
            <RestaurantMap restaurants={filteredRestaurants} selectedId={selectedRestaurant?.id} onSelect={handleSelect} />
          </div>
          {selectedRestaurant && (
            <div className="map-detail-card">
              <SelectedRestaurantCard
                copied={copiedRestaurantId === selectedRestaurant.id}
                restaurant={selectedRestaurant}
                onCopyAddress={handleCopyAddress}
              />
            </div>
          )}
        </section>
      )}

      {loadState === 'ready' && <DataNotice count={restaurants.length} />}
    </main>
  )
}

function DataNotice({ count }: { count: number }) {
  return (
    <footer className="data-notice" aria-label="데이터 출처">
      데이터: 소상공인시장진흥공단 백년가게 정보 기반 · 수록: 전국 음식점 {count.toLocaleString('ko-KR')}개
    </footer>
  )
}

function RegionPicker({
  allCount,
  areaOptions,
  activeProvince,
  activeCounty,
  activeProvinceOption,
  query,
  searchResults,
  onQueryChange,
  onProvinceSelect,
  onCountySelect,
  onAreaOpen,
  onAllSelect,
}: {
  allCount: number
  areaOptions: ProvinceOption[]
  activeProvince: string | null
  activeCounty: string
  activeProvinceOption: ProvinceOption | null
  query: string
  searchResults: Restaurant[]
  onQueryChange: (query: string) => void
  onProvinceSelect: (province: string) => void
  onCountySelect: (county: string) => void
  onAreaOpen: () => void
  onAllSelect: () => void
}) {
  const previewResults = query.trim() ? searchResults.slice(0, 6) : []
  const primaryMapActionLabel = query.trim() ? '지도 보기' : '전체 지도'

  return (
    <section className="region-panel" aria-label="검색 및 지역 선택">
      <div className="landing-search-card">
        <SearchBox
          value={query}
          onChange={onQueryChange}
          label="검색"
          placeholder="상호·주소"
        />
        <button className="primary-action" type="button" onClick={onAllSelect}>
          {primaryMapActionLabel} · {allCount.toLocaleString('ko-KR')}개
        </button>
      </div>

      {previewResults.length > 0 && (
        <div className="search-preview" aria-label="검색 미리보기">
          {previewResults.map((restaurant) => (
            <button key={restaurant.id} type="button" onClick={onAllSelect}>
              <strong>{restaurant.name}</strong>
              <span>{formatRestaurantArea(restaurant)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="region-select-grid" aria-label="지역 필터">
        <div className="select-box">
          <select aria-label="시·도" value={activeProvince ?? ''} onChange={(event) => onProvinceSelect(event.target.value)}>
            <option value="">시·도</option>
            {areaOptions.map((option) => (
              <option key={option.province} value={option.province}>
                {option.province} ({option.count.toLocaleString('ko-KR')})
              </option>
            ))}
          </select>
        </div>
        <div className="select-box">
          <select aria-label="시·군·구" disabled={!activeProvinceOption} value={activeCounty} onChange={(event) => onCountySelect(event.target.value)}>
            <option value="">전체</option>
            {activeProvinceOption?.counties.map((option) => (
              <option key={option.county} value={option.county}>
                {option.county} ({option.count.toLocaleString('ko-KR')})
              </option>
            ))}
          </select>
        </div>
        <button className="primary-action" type="button" disabled={!activeProvince} onClick={onAreaOpen}>
          지도 보기
        </button>
      </div>
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
    <div className="search-box">
      <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" />
    </div>
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

function formatRestaurantArea(restaurant: Restaurant): string {
  const province = getProvinceLabel(restaurant.address)
  const county = getCountyLabel(restaurant.address)
  return [province, county].filter(Boolean).join(' ')
}

export default App
