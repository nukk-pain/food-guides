import { useEffect, useState } from 'react'
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
    publisher: 'sbiz.or.kr',
    countLabel: '약 905곳',
    accent: 'green',
    description:
      '오랜 시간 같은 자리를 지킨 노포·인증 식당을 시·도와 시·군·구로 좁혀 빠르게 둘러봅니다.',
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
      '37개 우체국이 추천한 245곳을 권역과 우체국 단위로 살펴봅니다. 메뉴·영업시간·사진까지 한 화면.',
    href: 'postoffice-busan/',
  },
]

function App() {
  const [now] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    document.title = 'food-guides — 식당 추천 지도'
  }, [])

  return (
    <main className="app-shell">
      <header className="hero" aria-labelledby="page-title">
        <p className="eyebrow">food-guides</p>
        <h1 id="page-title">공공·기관 식당 추천을 한 지도에</h1>
        <p className="lede">
          여러 곳에 흩어진 식당 추천 자료를 같은 정적 지도 패턴으로 정리합니다. 검색·필터·외부 지도
          연결까지, 데이터 출처는 그대로 유지하면서 휴대폰에서 바로 쓸 수 있는 형태로.
        </p>
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

      <section className="about" aria-label="이 사이트는">
        <h2>이 사이트는</h2>
        <p>
          공공·기관이 만든 좋은 식당 자료가 PDF나 책자로 흩어져 있는 경우가 많습니다. food-guides는
          그런 자료를 가공해 정적 웹지도로 옮기는 모음입니다. 백엔드/DB 없이 GitHub Pages만 사용해
          비용 없이 운영합니다. 출처는 각 가이드 페이지에서 확인할 수 있습니다.
        </p>
        <p className="muted">
          새 가이드 제안이나 데이터 오류 제보는{' '}
          <a href="https://github.com/" rel="noreferrer" target="_blank">
            GitHub repository
          </a>
          {' '}이슈로 부탁드립니다.
        </p>
      </section>

      <footer className="footer" aria-label="푸터">
        <span>마지막 빌드 {now}</span>
        <span aria-hidden="true">·</span>
        <span>정적 사이트 (GitHub Pages)</span>
      </footer>
    </main>
  )
}

export default App
