import type { Restaurant } from './restaurants'

export const REGIONS = ['부산권', '경남권', '울산권'] as const
export type Region = (typeof REGIONS)[number]

export const POST_OFFICES_BY_REGION: Record<Region, readonly string[]> = {
  부산권: [
    '부산우체국',
    '동래우체국',
    '남부산우체국',
    '부산사상우체국',
    '부산금정우체국',
    '부산사하우체국',
    '해운대우체국',
    '부산진우체국',
    '북부산우체국',
    '부산연제우체국',
    '동부산우체국',
    '부산영도우체국',
    '부산강서우체국',
    '기장우체국',
  ],
  경남권: [
    '마산우체국',
    '진주우체국',
    '진해우체국',
    '창원우체국',
    '김해우체국',
    '양산우체국',
    '거제우체국',
    '통영우체국',
    '거창우체국',
    '고성우체국',
    '남해우체국',
    '밀양우체국',
    '사천우체국',
    '산청우체국',
    '의령우체국',
    '창녕우체국',
    '하동우체국',
    '함안우체국',
    '함양우체국',
    '합천우체국',
  ],
  울산권: ['울산우체국', '남울산우체국', '동울산우체국'],
}

export type PostOfficeOption = {
  name: string
  count: number
}

export type RegionGroup = {
  region: Region
  count: number
  postOffices: PostOfficeOption[]
}

export type Selection = {
  region: Region
  postOffice?: string
}

export function getRegionOf(postOffice: string): Region | null {
  for (const region of REGIONS) {
    if (POST_OFFICES_BY_REGION[region].includes(postOffice)) return region
  }
  return null
}

export function getRegionGroups(restaurants: Restaurant[]): RegionGroup[] {
  const byRegion = new Map<Region, Map<string, number>>(
    REGIONS.map((r) => [r, new Map<string, number>()]),
  )
  for (const r of restaurants) {
    const bucket = byRegion.get(r.region)
    if (!bucket) continue
    bucket.set(r.postOffice, (bucket.get(r.postOffice) ?? 0) + 1)
  }
  return REGIONS.map((region) => {
    const bucket = byRegion.get(region) ?? new Map()
    const postOffices: PostOfficeOption[] = POST_OFFICES_BY_REGION[region]
      .map((name) => ({ name, count: bucket.get(name) ?? 0 }))
      .filter((opt) => opt.count > 0)
    const count = postOffices.reduce((sum, opt) => sum + opt.count, 0)
    return { region, count, postOffices }
  }).filter((group) => group.count > 0)
}

export function filterBySelection(
  restaurants: Restaurant[],
  selection: Selection | null,
): Restaurant[] {
  if (!selection) return []
  return restaurants.filter((r) => {
    if (r.region !== selection.region) return false
    if (selection.postOffice && r.postOffice !== selection.postOffice) return false
    return true
  })
}
