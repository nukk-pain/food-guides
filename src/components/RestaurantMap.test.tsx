/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RestaurantMap } from './RestaurantMap'
import { restaurantPopupHtml } from './restaurantPopupHtml'

const leaflet = vi.hoisted(() => {
  const markers: Array<{
    bindPopup: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    addTo: ReturnType<typeof vi.fn>
    openPopup: ReturnType<typeof vi.fn>
  }> = []

  return {
    markers,
    clearLayers: vi.fn(),
    fitBounds: vi.fn(),
    reset() {
      markers.length = 0
      this.clearLayers.mockClear()
      this.fitBounds.mockClear()
    },
  }
})

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      fitBounds: leaflet.fitBounds,
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      clearLayers: leaflet.clearLayers,
    })),
    latLngBounds: vi.fn((bounds: unknown) => bounds),
    marker: vi.fn(() => {
      const marker = {
        bindPopup: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        openPopup: vi.fn().mockReturnThis(),
      }
      leaflet.markers.push(marker)
      return marker
    }),
    divIcon: vi.fn((options: unknown) => options),
  },
}))

const restaurant = {
  id: '1',
  name: '서울국밥 <맛집>',
  category: '음식점업',
  region: '서울 종로구',
  address: '서울특별시 종로구 종로 1',
  lat: 37.57,
  lng: 126.98,
}

const otherRestaurant = {
  ...restaurant,
  id: '2',
  name: '부산국밥',
  lat: 35.18,
  lng: 129.07,
}

describe('restaurant map popup', () => {
  afterEach(() => {
    cleanup()
    leaflet.reset()
  })

  it('renders only the escaped restaurant name for compact marker popups', () => {
    expect(restaurantPopupHtml(restaurant)).toBe('<strong>서울국밥 &lt;맛집&gt;</strong>')
  })

  it('opens the selected marker popup after React redraws markers', () => {
    const { rerender } = render(<RestaurantMap restaurants={[restaurant, otherRestaurant]} onSelect={vi.fn()} />)

    expect(leaflet.markers).toHaveLength(2)
    expect(leaflet.markers[0].openPopup).not.toHaveBeenCalled()

    rerender(<RestaurantMap restaurants={[restaurant, otherRestaurant]} selectedId="1" onSelect={vi.fn()} />)

    expect(leaflet.markers).toHaveLength(4)
    expect(leaflet.markers[2].openPopup).toHaveBeenCalledOnce()
    expect(leaflet.markers[3].openPopup).not.toHaveBeenCalled()
  })
})
