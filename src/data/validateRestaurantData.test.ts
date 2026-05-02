import { describe, expect, it } from 'vitest'
import { createRestaurantDataManifest, validateRestaurantData } from './validateRestaurantData'

const validRows = [
  {
    id: '1',
    name: '서울국밥',
    category: '음식점업',
    region: '서울특별시 종로구',
    address: '서울특별시 종로구 종로 1',
    lat: 37.57,
    lng: 126.98,
    phone: '021234567',
    sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=1',
  },
  {
    id: '2',
    name: '부산식당',
    category: '한식 음식점업',
    region: '부산광역시 해운대구',
    address: '부산광역시 해운대구 달맞이길 1',
    lat: 35.16,
    lng: 129.16,
    sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=2',
  },
]

describe('restaurant data validation', () => {
  it('accepts valid static restaurant JSON rows', () => {
    expect(validateRestaurantData(validRows, { minRows: 2 })).toEqual({ ok: true, errors: [], warnings: [] })
  })

  it('rejects corrupted or unsafe rows before deployment', () => {
    const result = validateRestaurantData(
      [
        validRows[0],
        { ...validRows[0], name: '중복ID' },
        { ...validRows[1], id: '3', lat: 0, lng: 0, sourceUrl: 'javascript:alert(1)' },
        { ...validRows[1], id: '4', address: '', category: '제조업', mainMenu: '실험 필드' },
      ],
      { minRows: 5 },
    )

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('row count 4 is below minimum 5')
    expect(result.errors).toContain('duplicate id: 1')
    expect(result.errors).toContain('row 3 has coordinates outside Korea bounds')
    expect(result.errors).toContain('row 3 has invalid sourceUrl host/path')
    expect(result.errors).toContain('row 4 is missing address')
    expect(result.errors).toContain('row 4 category is not restaurant-like: 제조업')
    expect(result.errors).toContain('row 4 contains deferred field mainMenu')
  })

  it('creates a manifest with count, schema version, and sha256', () => {
    const manifest = createRestaurantDataManifest(validRows, 'abc123')

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      source: 'SBIZ HPTC006',
      count: 2,
      sha256: 'abc123',
    })
    expect(new Date(manifest.generatedAt).toString()).not.toBe('Invalid Date')
  })
})
