import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { imageUrl, restaurantsDataUrl } from './data/restaurantsData'
import { buildMapLinks, copyableAddressText, normalizePhoneHref } from './domain/mapLinks'
import {
  filterBySelection,
  getRegionGroups,
  REGIONS,
  type RegionGroup,
  type Region,
  type Selection,
} from './domain/postOffices'
import {
  hasCoordinates,
  normalizeRestaurants,
  type RawRestaurant,
  type Restaurant,
} from './domain/restaurants'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'
type MapScope = 'all' | Selection | null

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [mapScope, setMapScope] = useState<MapScope>(null)
  const [activeRegion, setActiveRegion] = useState<Region | null>(null)
  const [activePostOffice, setActivePostOffice] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(restaurantsDataUrl())
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const rows = (await res.json()) as RawRestaurant[]
        const normalized = normalizeRestaurants(rows)
        if (cancelled) return
        setRestaurants(normalized)
        setLoadState(normalized.length > 0 ? 'ready' : 'empty')
      } catch (err) {
        console.error('Failed to load restaurant data', err)
        if (!cancelled) setLoadState('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const regionGroups = useMemo(() => getRegionGroups(restaurants), [restaurants])
  const activeRegionGroup = useMemo<RegionGroup | null>(
    () => regionGroups.find((g) => g.region === activeRegion) ?? null,
    [activeRegion, regionGroups],
  )

  const searchResults = useMemo(() => searchRestaurants(restaurants, query), [query, restaurants])

  const scopedRestaurants = useMemo(() => {
    if (mapScope === 'all') return restaurants
    return filterBySelection(restaurants, mapScope)
  }, [mapScope, restaurants])

  const filtered = useMemo(() => searchRestaurants(scopedRestaurants, query), [query, scopedRestaurants])
  const placeable = useMemo(() => filtered.filter(hasCoordinates), [filtered])

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const handleSelect = useCallback((r: Restaurant) => setSelectedId(r.id), [])

  const handleRegionSelect = useCallback((value: string) => {
    setActiveRegion((value as Region) || null)
    setActivePostOffice('')
  }, [])

  const handlePostOfficeSelect = useCallback((value: string) => {
    setActivePostOffice(value)
  }, [])

  const handleSelectionOpen = useCallback(() => {
    if (!activeRegion) return
    setMapScope({
      region: activeRegion,
      ...(activePostOffice ? { postOffice: activePostOffice } : {}),
    })
    setSelectedId(null)
  }, [activeRegion, activePostOffice])

  const handleAllSelect = useCallback(() => {
    setMapScope('all')
    setSelectedId(null)
  }, [])

  const handleBackToPicker = useCallback(() => {
    setMapScope(null)
    setSelectedId(null)
  }, [])

  const handleCopyAddress = useCallback(async (r: Restaurant) => {
    const writeText = navigator.clipboard?.writeText
    if (typeof writeText !== 'function') {
      setCopiedId(null)
      return
    }
    try {
      await writeText.call(navigator.clipboard, copyableAddressText(r))
      setCopiedId(r.id)
    } catch {
      setCopiedId(null)
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <p className="eyebrow">부산·울산·경남 37개 우체국 · 추천 {restaurants.length.toLocaleString('ko-KR')}곳</p>
        <h1 id="page-title">우체국 추천 맛집가이드</h1>
        <p className="hero-description">2025년 부산지방우정청이 추천한 맛집 245곳을 권역과 우체국별로 둘러보세요.</p>
      </section>

      {loadState === 'loading' && (
        <StatusCard title="데이터를 불러오는 중입니다" description="정적 JSON 파일을 읽고 있어요." />
      )}
      {loadState === 'error' && (
        <StatusCard
          title="데이터를 불러오지 못했습니다"
          description="public/data/restaurants.json 파일이 빌드되었는지 확인해주세요. (npm run transform:data)"
        />
      )}
      {loadState === 'empty' && (
        <StatusCard title="표시할 식당이 없습니다" description="추출된 식당 데이터가 비어 있습니다." />
      )}

      {loadState === 'ready' && !mapScope && (
        <RegionPicker
          allCount={searchResults.length}
          regionGroups={regionGroups}
          activeRegion={activeRegion}
          activePostOffice={activePostOffice}
          activeRegionGroup={activeRegionGroup}
          query={query}
          searchResults={searchResults}
          onQueryChange={setQuery}
          onRegionSelect={handleRegionSelect}
          onPostOfficeSelect={handlePostOfficeSelect}
          onOpenSelection={handleSelectionOpen}
          onAllSelect={handleAllSelect}
        />
      )}

      {loadState === 'ready' && mapScope && (
        <section className="map-screen" aria-label="추천 맛집 지도">
          <div className="map-toolbar">
            <button type="button" className="ghost-button" onClick={handleBackToPicker}>
              ← 지역 다시 고르기
            </button>
            <span className="map-toolbar__count">
              {placeable.length.toLocaleString('ko-KR')}곳 표시
              {filtered.length > placeable.length && (
                <em className="muted"> · 좌표 미수집 {filtered.length - placeable.length}곳</em>
              )}
            </span>
          </div>
          <div className="map-panel">
            <RestaurantMap restaurants={filtered} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          </div>
          {selected && (
            <SelectedRestaurantCard
              copied={copiedId === selected.id}
              restaurant={selected}
              onCopyAddress={handleCopyAddress}
            />
          )}
        </section>
      )}

      {loadState === 'ready' && (
        <footer className="data-notice" aria-label="데이터 출처">
          데이터: 부산지방우정청 「2025년판 우체국 추천 맛집가이드」 ·
          수록 {restaurants.length.toLocaleString('ko-KR')}곳
        </footer>
      )}
    </main>
  )
}

function RegionPicker({
  allCount,
  regionGroups,
  activeRegion,
  activePostOffice,
  activeRegionGroup,
  query,
  searchResults,
  onQueryChange,
  onRegionSelect,
  onPostOfficeSelect,
  onOpenSelection,
  onAllSelect,
}: {
  allCount: number
  regionGroups: RegionGroup[]
  activeRegion: Region | null
  activePostOffice: string
  activeRegionGroup: RegionGroup | null
  query: string
  searchResults: Restaurant[]
  onQueryChange: (q: string) => void
  onRegionSelect: (value: string) => void
  onPostOfficeSelect: (value: string) => void
  onOpenSelection: () => void
  onAllSelect: () => void
}) {
  const previewResults = query.trim() ? searchResults.slice(0, 6) : []
  const primaryLabel = query.trim() ? '검색 결과 지도' : '전체 지도'

  return (
    <section className="region-panel" aria-label="검색 및 지역 선택">
      <div className="landing-search-card">
        <div className="search-box">
          <input
            aria-label="검색"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="상호·주소·우체국·메뉴"
            type="search"
          />
        </div>
        <button className="primary-action" type="button" onClick={onAllSelect}>
          {primaryLabel} · {allCount.toLocaleString('ko-KR')}곳
        </button>
      </div>

      {previewResults.length > 0 && (
        <div className="search-preview" aria-label="검색 미리보기">
          {previewResults.map((r) => (
            <button key={r.id} type="button" onClick={onAllSelect}>
              <strong>{r.name}</strong>
              <span>
                {r.postOffice} 추천 {r.recommendationNo}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="region-select-grid" aria-label="권역·우체국 필터">
        <div className="select-box">
          <select
            aria-label="권역"
            value={activeRegion ?? ''}
            onChange={(e) => onRegionSelect(e.target.value)}
          >
            <option value="">권역</option>
            {regionGroups.map((group) => (
              <option key={group.region} value={group.region}>
                {group.region} ({group.count.toLocaleString('ko-KR')})
              </option>
            ))}
          </select>
        </div>
        <div className="select-box">
          <select
            aria-label="우체국"
            disabled={!activeRegionGroup}
            value={activePostOffice}
            onChange={(e) => onPostOfficeSelect(e.target.value)}
          >
            <option value="">전체 우체국</option>
            {activeRegionGroup?.postOffices.map((opt) => (
              <option key={opt.name} value={opt.name}>
                {opt.name} ({opt.count.toLocaleString('ko-KR')})
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary-action"
          type="button"
          disabled={!activeRegion}
          onClick={onOpenSelection}
        >
          선택 지도 보기
        </button>
      </div>

      <details className="region-meta">
        <summary>권역별 우체국 수록 현황</summary>
        <ul className="region-meta__list">
          {REGIONS.map((region) => {
            const group = regionGroups.find((g) => g.region === region)
            return (
              <li key={region}>
                <strong>{region}</strong>
                <span>{group ? `${group.postOffices.length}개 우체국 · ${group.count}곳` : '데이터 없음'}</span>
              </li>
            )
          })}
        </ul>
      </details>
    </section>
  )
}

function SelectedRestaurantCard({
  copied,
  restaurant,
  onCopyAddress,
}: {
  copied: boolean
  restaurant: Restaurant
  onCopyAddress: (r: Restaurant) => Promise<void>
}) {
  const phoneHref = normalizePhoneHref(restaurant.phone)
  const links = buildMapLinks(restaurant)
  const heroImage = restaurant.images[0]

  return (
    <article className="selected-card" aria-label="선택한 식당 정보">
      {heroImage && (
        <div className="selected-card__hero">
          <img src={imageUrl(heroImage)} alt={restaurant.name} loading="lazy" />
        </div>
      )}
      <header className="selected-card__header">
        <p className="selected-card__post">
          {restaurant.postOffice} · 추천 {restaurant.recommendationNo}
          {restaurant.postOfficeArea && (
            <span className="muted"> ({restaurant.postOfficeArea})</span>
          )}
        </p>
        <h2>{restaurant.name}</h2>
        {restaurant.description && <p className="selected-card__desc">{restaurant.description}</p>}
      </header>

      {restaurant.menu && (
        <section className="selected-card__row">
          <h3>메뉴</h3>
          <p>{restaurant.menu}</p>
        </section>
      )}

      <section className="selected-card__row">
        <h3>주소</h3>
        <p>{restaurant.address}</p>
      </section>

      {restaurant.hours && (
        <section className="selected-card__row">
          <h3>영업시간</h3>
          <p>{restaurant.hours}</p>
        </section>
      )}

      <div className="action-row" aria-label="식당 바로가기">
        {phoneHref && (
          <a className="action-button action-button--primary" href={phoneHref}>
            전화 {restaurant.phone}
          </a>
        )}
        <button className="action-button" type="button" onClick={() => void onCopyAddress(restaurant)}>
          {copied ? '복사 완료' : '주소 복사'}
        </button>
      </div>

      <div className="map-link-row" aria-label="외부 지도에서 보기">
        <a href={links.naver} target="_blank" rel="noreferrer">네이버지도</a>
        <a href={links.kakao} target="_blank" rel="noreferrer">카카오맵</a>
        <a href={links.google} target="_blank" rel="noreferrer">구글맵</a>
      </div>

      {restaurant.images.length > 1 && (
        <section className="selected-card__gallery" aria-label="식당 사진">
          {restaurant.images.slice(1).map((path) => (
            <img key={path} src={imageUrl(path)} alt="" loading="lazy" />
          ))}
        </section>
      )}
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
  const q = query.trim().toLocaleLowerCase('ko-KR')
  if (!q) return restaurants
  return restaurants.filter((r) => {
    const haystack = [r.name, r.postOffice, r.address, r.description, r.menu].join(' ').toLocaleLowerCase('ko-KR')
    return haystack.includes(q)
  })
}

export default App
