import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { homeUrl, imageUrl, restaurantsDataUrl } from './data/restaurantsData'
import {
  buildGoogleSearchUrl,
  buildMapLinks,
  copyableAddressText,
  normalizePhoneHref,
} from './domain/mapLinks'
import {
  filterBySelection,
  getRegionGroups,
  type RegionGroup,
  type Region,
} from './domain/postOffices'
import {
  hasCoordinates,
  normalizeRestaurants,
  type RawRestaurant,
  type Restaurant,
} from './domain/restaurants'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState<Region | ''>('')
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

  const scoped = useMemo(() => {
    if (!activeRegion) return restaurants
    return filterBySelection(restaurants, {
      region: activeRegion,
      ...(activePostOffice ? { postOffice: activePostOffice } : {}),
    })
  }, [activeRegion, activePostOffice, restaurants])

  const filtered = useMemo(() => searchRestaurants(scoped, query), [query, scoped])
  const placeable = useMemo(() => filtered.filter(hasCoordinates), [filtered])

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const handleSelect = useCallback((r: Restaurant) => setSelectedId(r.id), [])

  const handleRegionSelect = useCallback((value: string) => {
    setActiveRegion((value as Region) || '')
    setActivePostOffice('')
    setSelectedId(null)
  }, [])

  const handlePostOfficeSelect = useCallback((value: string) => {
    setActivePostOffice(value)
    setSelectedId(null)
  }, [])

  const handleClearFilters = useCallback(() => {
    setQuery('')
    setActiveRegion('')
    setActivePostOffice('')
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

  const hasFilter = query.trim() !== '' || activeRegion !== '' || activePostOffice !== ''

  return (
    <main className="app-shell">
      <header className="page-header">
        <a className="home-link" href={homeUrl()}>← 가이드 목록</a>
        <h1>우체국 추천 맛집가이드</h1>
        <p className="page-summary">
          부산·울산·경남 37개 우체국이 추천한 {restaurants.length.toLocaleString('ko-KR')}곳
        </p>
      </header>

      {loadState === 'loading' && <StatusCard title="불러오는 중" description="식당 데이터를 읽고 있어요." />}
      {loadState === 'error' && <StatusCard title="불러오지 못했습니다" description="잠시 후 다시 시도해주세요." />}
      {loadState === 'empty' && <StatusCard title="표시할 식당이 없습니다" description="추출된 데이터가 비어 있습니다." />}

      {loadState === 'ready' && (
        <>
          <section className="picker" aria-label="검색 및 필터">
            <div className="picker__search">
              <input
                aria-label="검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상호·주소·메뉴"
                type="search"
                inputMode="search"
              />
            </div>
            <div className="picker__filters">
              <label className="select-box">
                <span>권역</span>
                <select value={activeRegion} onChange={(e) => handleRegionSelect(e.target.value)}>
                  <option value="">전체</option>
                  {regionGroups.map((g) => (
                    <option key={g.region} value={g.region}>
                      {g.region} ({g.count.toLocaleString('ko-KR')})
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-box">
                <span>우체국</span>
                <select
                  value={activePostOffice}
                  disabled={!activeRegionGroup}
                  onChange={(e) => handlePostOfficeSelect(e.target.value)}
                >
                  <option value="">{activeRegionGroup ? '전체' : '권역 먼저'}</option>
                  {activeRegionGroup?.postOffices.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name} ({opt.count.toLocaleString('ko-KR')})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="picker__status" aria-live="polite">
              <strong>{filtered.length.toLocaleString('ko-KR')}곳</strong>
              <span className="muted">
                {placeable.length < filtered.length
                  ? ` · 지도 표시 ${placeable.length.toLocaleString('ko-KR')}곳`
                  : ''}
              </span>
              {hasFilter && (
                <button type="button" className="ghost-button" onClick={handleClearFilters}>
                  초기화
                </button>
              )}
            </div>
          </section>

          <section className="map-panel" aria-label="식당 지도">
            <RestaurantMap restaurants={filtered} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          </section>

          {selected && (
            <SelectedRestaurantCard
              copied={copiedId === selected.id}
              restaurant={selected}
              onCopyAddress={handleCopyAddress}
              onClose={() => setSelectedId(null)}
            />
          )}

          <footer className="data-notice" aria-label="데이터 출처">
            데이터: 부산지방우정청 「2025년판 우체국 추천 맛집가이드」
          </footer>
        </>
      )}
    </main>
  )
}

function SelectedRestaurantCard({
  copied,
  restaurant,
  onCopyAddress,
  onClose,
}: {
  copied: boolean
  restaurant: Restaurant
  onCopyAddress: (r: Restaurant) => Promise<void>
  onClose: () => void
}) {
  const phoneHref = normalizePhoneHref(restaurant.phone)
  const links = buildMapLinks(restaurant)
  const searchUrl = buildGoogleSearchUrl(restaurant)

  return (
    <article className="selected-card" aria-label="선택한 식당 정보">
      <header className="selected-card__header">
        <div className="selected-card__title-row">
          <p className="selected-card__post">
            {restaurant.postOffice} · 추천 {restaurant.recommendationNo}
          </p>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <h2>{restaurant.name}</h2>
        {restaurant.description && <p className="selected-card__desc">{restaurant.description}</p>}
      </header>

      {restaurant.images.length > 0 && (
        <section className="thumb-grid" aria-label="식당 사진">
          {restaurant.images.map((path) => (
            <img key={path} src={imageUrl(path)} alt="" loading="lazy" />
          ))}
        </section>
      )}

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

      <div className="map-link-row" aria-label="외부 링크">
        <a href={links.naver} target="_blank" rel="noreferrer">네이버지도</a>
        <a href={links.kakao} target="_blank" rel="noreferrer">카카오맵</a>
        <a href={links.google} target="_blank" rel="noreferrer">구글맵</a>
        <a href={searchUrl} target="_blank" rel="noreferrer">구글 검색</a>
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
  const q = query.trim().toLocaleLowerCase('ko-KR')
  if (!q) return restaurants
  return restaurants.filter((r) => {
    const haystack = [r.name, r.postOffice, r.address, r.description, r.menu]
      .join(' ')
      .toLocaleLowerCase('ko-KR')
    return haystack.includes(q)
  })
}

export default App
