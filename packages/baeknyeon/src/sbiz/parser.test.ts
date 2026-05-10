import { describe, expect, it } from 'vitest'
import { buildSbizListPayload, geocodeQueryVariants, parseSbizListPage, toPublicRestaurantRows } from './parser'

const listHtml = `
<p class="bt_count"> <span>총</span><strong>905</strong><span>건</span>&nbsp;<strong>[1/57 페이지]</strong> </p>
<div id="marketList">
  <table><tbody>
    <tr>
      <td class="dp_n_m">905</td>
      <td class="ta_l bl_fl0"><a class="bl_link" href="javascript:fn_goPage('20240059799','rcpnNo','/hdst/main/ohndMarketDetail.do')">고령금산한우</a></td>
      <td class="dp_n_m">음식점업</td>
      <td class="dp_n_m">0549564484</td>
      <td class="ta_l">경상북도 고령군 성산면 성산로 946-5</td>
    </tr>
    <tr>
      <td class="dp_n_m">904</td>
      <td class="ta_l bl_fl0"><a class="bl_link" href="javascript:fn_goPage('20230021133','rcpnNo','/hdst/main/ohndMarketDetail.do')">도투리 샤브칼국수 불광천</a></td>
      <td class="dp_n_m">음식점업</td>
      <td class="dp_n_m">023743202</td>
      <td class="ta_l">서울특별시 은평구 증산로 303 (증산동, 태광아파트)</td>
    </tr>
  </tbody></table>
</div>
`

describe('sbiz parser', () => {
  it('builds the POST payload for 백년가게 음식점업 list pages', () => {
    expect(buildSbizListPayload({ page: 3 }).toString()).toBe(
      'searchCity=&searchCounty=&searchTpbsCd=HPTC006&currentPage=3&pageSize=16&viewType=list&entpNmAdd=',
    )
  })

  it('parses total/page count and restaurant rows from the list page table', () => {
    expect(parseSbizListPage(listHtml)).toEqual({
      totalCount: 905,
      currentPage: 1,
      totalPages: 57,
      rows: [
        {
          id: '20240059799',
          name: '고령금산한우',
          category: '음식점업',
          phone: '0549564484',
          address: '경상북도 고령군 성산면 성산로 946-5',
          sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799',
        },
        {
          id: '20230021133',
          name: '도투리 샤브칼국수 불광천',
          category: '음식점업',
          phone: '023743202',
          address: '서울특별시 은평구 증산로 303 (증산동, 태광아파트)',
          sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20230021133',
        },
      ],
    })
  })

  it('creates geocoding query fallbacks by removing building parentheticals', () => {
    expect(geocodeQueryVariants('경기도 군포시 번영로 508(금정동)')).toEqual([
      '경기도 군포시 번영로 508(금정동)',
      '경기도 군포시 번영로 508',
      '군포시 번영로 508 경기도',
    ])
  })

  it('converts parsed rows plus geocode cache to public app rows', () => {
    const parsed = parseSbizListPage(listHtml).rows

    expect(
      toPublicRestaurantRows(parsed, {
        '경상북도 고령군 성산면 성산로 946-5': { lat: 35.747, lng: 128.266 },
      }),
    ).toEqual([
      {
        id: '20240059799',
        name: '고령금산한우',
        category: '음식점업',
        region: '경상북도 고령군',
        address: '경상북도 고령군 성산면 성산로 946-5',
        lat: 35.747,
        lng: 128.266,
        phone: '0549564484',
        sourceUrl: 'https://www.sbiz.or.kr/hdst/main/ohndMarketDetail.do?rcpnNo=20240059799',
      },
    ])
  })
})
