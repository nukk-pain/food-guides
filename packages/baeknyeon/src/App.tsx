import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { RestaurantMap } from './components/RestaurantMap'
import { homeUrl, restaurantsDataUrl } from './data/restaurantsData'
import { copyableAddressText, buildMapLinks, normalizePhoneHref, safeSbizDetailUrl } from './domain/mapLinks'
import { filterRestaurantStores, type RawRestaurant, type Restaurant } from './domain/restaurants'
import {
  filterByArea,
  getAreaOptions,
  getCountyLabel,
  getProvinceLabel,
  type ProvinceOption,
} from './domain/regions'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [activeProvince, setActiveProvince] = useState('')
  const [activeCounty, setActiveCounty] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(restaurantsDataUrl())
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const rows = (await response.json()) as RawRestaurant[]
        const normalized = filterRestaurantStores(rows)
        if (cancelled) return
        setRestaurants(normalized)
        setLoadState(normalized.length > 0 ? 'ready' : 'empty')
      } catch (error) {
        console.error('Failed to load restaurant data', error)
        if (!cancelled) setLoadState('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const areaOptions = useMemo(() => getAreaOptions(restaurants), [restaurants])
  const activeProvinceOption = useMemo<ProvinceOption | null>(
    () => areaOptions.find((option) => option.province === activeProvince) ?? null,
    [activeProvince, areaOptions],
  )

  const scoped = useMemo(() => {
    if (!activeProvince) return restaurants
    return filterByArea(restaurants, {
      province: activeProvince,
      ...(activeCounty ? { county: activeCounty } : {}),
    })
  }, [activeCounty, activeProvince, restaurants])

  const filtered = useMemo(() => searchRestaurants(scoped, query), [query, scoped])

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const handleSelect = useCallback((r: Restaurant) => setSelectedId(r.id), [])

  const handleProvinceSelect = useCallback((value: string) => {
    setActiveProvince(value)
    setActiveCounty('')
    setSelectedId(null)
  }, [])

  const handleCountySelect = useCallback((value: string) => {
    setActiveCounty(value)
    setSelectedId(null)
  }, [])

  const handleClearFilters = useCallback(() => {
    setQuery('')
    setActiveProvince('')
    setActiveCounty('')
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

  const hasFilter = query.trim() !== '' || activeProvince !== '' || activeCounty !== ''

  return (
    <main className="app-shell">
      <header className="page-header">
        <a className="home-link" href={homeUrl()}>← 가이드 목록</a>
        <h1>백년가게 식당 지도</h1>
        <p className="page-summary">
          전국 백년가게 음식점 {restaurants.length.toLocaleString('ko-KR')}곳
        </p>
      </header>

      {loadState === 'loading' && <StatusCard title="불러오는 중" description="식당 데이터를 읽고 있어요." />}
      {loadState === 'error' && <StatusCard title="불러오지 못했습니다" description="public/data/restaurants.json 파일을 확인해주세요." />}
      {loadState === 'empty' && <StatusCard title="표시할 식당이 없습니다" description="음식점업 + 좌표가 있는 데이터가 필요합니다." />}

      {loadState === 'ready' && (
        <>
          <section className="picker" aria-label="검색 및 지역 선택">
            <div className="picker__search">
              <input
                aria-label="검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상호·주소"
                type="search"
                inputMode="search"
              />
            </div>
            <div className="picker__filters">
              <label className="select-box">
                <span>시·도</span>
                <select value={activeProvince} onChange={(e) => handleProvinceSelect(e.target.value)}>
                  <option value="">전체</option>
                  {areaOptions.map((option) => (
                    <option key={option.province} value={option.province}>
                      {option.province} ({option.count.toLocaleString('ko-KR')})
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-box">
                <span>시·군·구</span>
                <select
                  value={activeCounty}
                  disabled={!activeProvinceOption}
                  onChange={(e) => handleCountySelect(e.target.value)}
                >
                  <option value="">{activeProvinceOption ? '전체' : '시·도 먼저'}</option>
                  {activeProvinceOption?.counties.map((option) => (
                    <option key={option.county} value={option.county}>
                      {option.county} ({option.count.toLocaleString('ko-KR')})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="picker__status" aria-live="polite">
              <strong>{filtered.length.toLocaleString('ko-KR')}개</strong>
              {hasFilter && (
                <button type="button" className="ghost-button" onClick={handleClearFilters}>
                  초기화
                </button>
              )}
            </div>
          </section>

          <section className="map-panel" aria-label="백년가게 식당 지도">
            <RestaurantMap restaurants={filtered} selectedId={selected?.id} onSelect={handleSelect} />
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
            데이터: 소상공인시장진흥공단 백년가게 정보 기반
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
  const sourceUrl = safeSbizDetailUrl(restaurant.sourceUrl)
  const province = getProvinceLabel(restaurant.address)
  const county = getCountyLabel(restaurant.address)

  return (
    <article className="selected-card" aria-label="선택한 식당 정보">
      <header className="selected-card__header">
        <div className="selected-card__title-row">
          <p className="selected-card__post">
            {[province, county].filter(Boolean).join(' ')}
          </p>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <h2>{restaurant.name}</h2>
      </header>

      <section className="selected-card__row">
        <h3>주소</h3>
        <p>{restaurant.address}</p>
      </section>

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
        <a href={links.naver} target="_blank" rel="noreferrer">네이버지도</a>
        <a href={links.kakao} target="_blank" rel="noreferrer">카카오맵</a>
        <a href={links.google} target="_blank" rel="noreferrer">구글맵</a>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer">원문</a>
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
  const q = query.trim().toLocaleLowerCase('ko-KR')
  if (!q) return restaurants
  return restaurants.filter((r) => {
    const haystack = [r.name, r.region, r.address, r.category].join(' ').toLocaleLowerCase('ko-KR')
    return haystack.includes(q)
  })
}

export default App
