/** @vitest-environment node */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const siteUrl = 'https://nukk-pain.github.io/baeknyeon-restaurant-map/'

function metaContent(selector: string) {
  const match = html.match(new RegExp(`<meta[^>]+${selector}[^>]+content="([^"]+)"[^>]*>`))
  return match?.[1]
}

describe('static AEO metadata', () => {
  it('describes the Korean 백년가게 map page for answer engines and sharing', () => {
    expect(html).toContain('<html lang="ko">')
    expect(html).toContain('<title>백년가게 식당 지도 - 전국 905개 백년가게 음식점 검색</title>')
    expect(metaContent('name="description"')).toBe('전국 백년가게 식당 905개를 상호명, 주소, 지역별로 검색하고 지도에서 확인할 수 있는 백년가게 식당 지도입니다.')
    expect(html).toContain(`<link rel="canonical" href="${siteUrl}" />`)
    expect(metaContent('property="og:title"')).toBe('백년가게 식당 지도')
    expect(metaContent('property="og:locale"')).toBe('ko_KR')
    expect(metaContent('name="twitter:card"')).toBe('summary')
  })

  it('publishes structured data for the app, dataset, and common questions', () => {
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]

    expect(jsonLd).toBeTruthy()
    const structuredData = JSON.parse(jsonLd ?? '{}')
    const graph = structuredData['@graph'] as Array<Record<string, unknown>>

    expect(graph.map((item) => item['@type'])).toEqual(['WebApplication', 'Dataset', 'FAQPage'])
    expect(graph[0]).toMatchObject({
      name: '백년가게 식당 지도',
      applicationCategory: 'MapApplication',
      operatingSystem: 'Web',
      url: 'https://nukk-pain.github.io/baeknyeon-restaurant-map/',
    })
    expect(graph[1]).toMatchObject({
      name: '백년가게 식당 지도 데이터',
      keywords: ['백년가게', '식당', '맛집', '노포', '전국 맛집 지도'],
    })
    expect(graph[2]).toMatchObject({
      mainEntity: expect.arrayContaining([
        expect.objectContaining({
          name: '백년가게 식당 지도는 무엇인가요?',
        }),
      ]),
    })
  })
  it('exposes crawl hints for the deployed static site', () => {
    const robotsUrl = new URL('../public/robots.txt', import.meta.url)
    const sitemapUrl = new URL('../public/sitemap.xml', import.meta.url)

    expect(existsSync(robotsUrl)).toBe(true)
    expect(existsSync(sitemapUrl)).toBe(true)
    expect(readFileSync(robotsUrl, 'utf8')).toContain(`Sitemap: ${siteUrl}sitemap.xml`)
    expect(readFileSync(sitemapUrl, 'utf8')).toContain(`<loc>${siteUrl}</loc>`)
  })
})
