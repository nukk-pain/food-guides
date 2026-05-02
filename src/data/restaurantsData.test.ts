import { describe, expect, it } from 'vitest'
import { restaurantsDataUrl } from './restaurantsData'

describe('restaurantsDataUrl', () => {
  it('resolves public data below the current Vite base path for GitHub Pages project sites', () => {
    expect(restaurantsDataUrl('/baeknyeon-restaurant-map/')).toBe('/baeknyeon-restaurant-map/data/restaurants.json')
  })

  it('keeps local development data path rooted at the local Vite server', () => {
    expect(restaurantsDataUrl('/')).toBe('/data/restaurants.json')
  })
})
