import { useEffect } from 'react'
import './App.css'

type Guide = {
  slug: string
  name: string
  region: string
  source: string
  publisher: string
  countLabel: string
  accent: string
  description: string
  href: string
}

const GUIDES: Guide[] = [
  {
    slug: 'baeknyeon',
    name: '백년가게 식당 지도',
    region: '전국',
    source: '소상공인시장진흥공단',
    publisher: '공공데이터 기반',
    countLabel: '약 905곳',
    accent: 'green',
    description:
      '오래 한 자리를 지키며 단골이 많은 노포 식당. 정부가 직접 인증한 곳들이라 믿고 가볼 만합니다.',
    href: 'baeknyeon/',
  },
  {
    slug: 'postoffice-busan',
    name: '우체국 추천 맛집가이드',
    region: '부산 · 울산 · 경남',
    source: '부산지방우정청',
    publisher: '2025년판',
    countLabel: '245곳',
    accent: 'red',
    description:
      '동네를 가장 잘 아는 우체국 직원들이 직접 다녀보고 추천한 진짜 동네 맛집들.',
    href: 'postoffice-busan/',
  },
]

function App() {
  useEffect(() => {
    document.title = '맛집가이드 지도'
  }, [])

  return (
    <main className="app-shell">
      <header className="hero" aria-labelledby="page-title">
        <h1 id="page-title">맛집가이드 지도</h1>
        <p className="lede">공공기관이 추천한 식당을 지도에서 확인하세요.</p>
      </header>

      <section className="guide-grid" aria-label="가이드 목록">
        {GUIDES.map((g) => (
          <a key={g.slug} className={`guide-card guide-card--${g.accent}`} href={g.href}>
            <div className="guide-card__top">
              <p className="guide-card__count">{g.countLabel}</p>
              <p className="guide-card__region">{g.region}</p>
            </div>
            <h2 className="guide-card__name">{g.name}</h2>
            <p className="guide-card__desc">{g.description}</p>
            <div className="guide-card__meta">
              <span>{g.source}</span>
              <span className="guide-card__publisher">{g.publisher}</span>
            </div>
            <span className="guide-card__cta" aria-hidden="true">
              지도 열기 →
            </span>
          </a>
        ))}
      </section>
    </main>
  )
}

export default App
