/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { restaurantPopupHtml } from './restaurantPopupHtml'

const restaurant = {
  id: '1',
  name: '서울국밥 <맛집>',
  category: '음식점업',
  region: '서울 종로구',
  address: '서울특별시 종로구 종로 1',
  lat: 37.57,
  lng: 126.98,
}

describe('restaurant map popup', () => {
  it('renders only the escaped restaurant name for compact marker popups', () => {
    expect(restaurantPopupHtml(restaurant)).toBe('<strong>서울국밥 &lt;맛집&gt;</strong>')
  })
})
