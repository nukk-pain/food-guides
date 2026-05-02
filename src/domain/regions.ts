import type { Restaurant } from './restaurants'
import { normalizeMetropolitanAddress } from './restaurants'

export type AreaSelection = {
  province: string
  county?: string
}

export type CountyOption = {
  county: string
  count: number
}

export type ProvinceOption = {
  province: string
  count: number
  counties: CountyOption[]
}

const PROVINCE_LABELS: Record<string, string> = {
  서울특별시: '서울',
  서울시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  대구시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원도: '강원',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
}

const PROVINCE_ORDER = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
  '세종',
]

export function getProvinceLabel(address: string): string {
  const firstToken = normalizeMetropolitanAddress(address).trim().split(/\s+/)[0] ?? ''
  return PROVINCE_LABELS[firstToken] ?? firstToken
}

export function getCountyLabel(address: string): string {
  return normalizeMetropolitanAddress(address).trim().split(/\s+/)[1] ?? ''
}

export function getAreaOptions(restaurants: Restaurant[]): ProvinceOption[] {
  const provinces = new Map<string, { count: number; counties: Map<string, number> }>()

  for (const restaurant of restaurants) {
    const province = getProvinceLabel(restaurant.address)
    const county = getCountyLabel(restaurant.address)
    if (!province) continue

    const provinceOption = provinces.get(province) ?? { count: 0, counties: new Map<string, number>() }
    provinceOption.count += 1
    if (county) provinceOption.counties.set(county, (provinceOption.counties.get(county) ?? 0) + 1)
    provinces.set(province, provinceOption)
  }

  return [...provinces.entries()]
    .map(([province, option]) => ({
      province,
      count: option.count,
      counties: [...option.counties.entries()]
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => a.county.localeCompare(b.county, 'ko-KR')),
    }))
    .sort((a, b) => provinceSortIndex(a.province) - provinceSortIndex(b.province))
}

export function filterByArea(restaurants: Restaurant[], selection: AreaSelection | null): Restaurant[] {
  if (!selection) return []

  return restaurants.filter((restaurant) => {
    const provinceMatches = getProvinceLabel(restaurant.address) === selection.province
    const countyMatches = !selection.county || getCountyLabel(restaurant.address) === selection.county
    return provinceMatches && countyMatches
  })
}

function provinceSortIndex(province: string): number {
  const index = PROVINCE_ORDER.indexOf(province)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
