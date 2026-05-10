/**
 * Korean administrative-region helpers shared by every guide.
 * Pickers use 시·도 (province) and 시·군·구 (county) extracted from the
 * address string itself, not from any guide-specific grouping.
 */

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

export type WithAddress = { address: string }

const PROVINCE_PREFIX_ALIASES: Record<string, string> = {
  서울: '서울특별시',
  서울시: '서울특별시',
  부산: '부산광역시',
  부산시: '부산광역시',
  대구: '대구광역시',
  대구시: '대구광역시',
  인천: '인천광역시',
  인천시: '인천광역시',
  광주: '광주광역시',
  광주시: '광주광역시',
  대전: '대전광역시',
  대전시: '대전광역시',
  울산: '울산광역시',
  울산시: '울산광역시',
  세종: '세종특별자치시',
  세종시: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
}

const COUNTY_ALIASES: Record<string, string> = {
  '서울특별시 동대무': '동대문구',
  '경상북도 김청시': '김천시',
  '경상남도 통영': '통영시',
  '경상남도 마산시': '창원시',
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
  '서울', '부산', '대구', '인천', '광주', '대전', '울산',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '세종',
]

export function normalizeMetropolitanAddress(value: string): string {
  const match = value.match(/^(\S+)(?:\s+(\S+))?/)
  if (!match) return value

  const province = PROVINCE_PREFIX_ALIASES[match[1]] ?? match[1]
  const county = match[2] ? COUNTY_ALIASES[`${province} ${match[2]}`] ?? match[2] : undefined
  const prefix = county ? `${province} ${county}` : province

  return `${prefix}${value.slice(match[0].length)}`
}

export function getProvinceLabel(address: string): string {
  const firstToken = normalizeMetropolitanAddress(address).trim().split(/\s+/)[0] ?? ''
  return PROVINCE_LABELS[firstToken] ?? firstToken
}

export function getCountyLabel(address: string): string {
  return normalizeMetropolitanAddress(address).trim().split(/\s+/)[1] ?? ''
}

export function getAreaOptions<T extends WithAddress>(items: T[]): ProvinceOption[] {
  const provinces = new Map<string, { count: number; counties: Map<string, number> }>()

  for (const item of items) {
    const province = getProvinceLabel(item.address)
    const county = getCountyLabel(item.address)
    if (!province) continue

    const opt = provinces.get(province) ?? { count: 0, counties: new Map<string, number>() }
    opt.count += 1
    if (county) opt.counties.set(county, (opt.counties.get(county) ?? 0) + 1)
    provinces.set(province, opt)
  }

  return [...provinces.entries()]
    .map(([province, opt]) => ({
      province,
      count: opt.count,
      counties: [...opt.counties.entries()]
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => a.county.localeCompare(b.county, 'ko-KR')),
    }))
    .sort((a, b) => provinceSortIndex(a.province) - provinceSortIndex(b.province))
}

export function filterByArea<T extends WithAddress>(items: T[], selection: AreaSelection | null): T[] {
  if (!selection) return items
  return items.filter((item) => {
    const provinceMatches = getProvinceLabel(item.address) === selection.province
    const countyMatches = !selection.county || getCountyLabel(item.address) === selection.county
    return provinceMatches && countyMatches
  })
}

function provinceSortIndex(province: string): number {
  const index = PROVINCE_ORDER.indexOf(province)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
