import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import type { Restaurant } from '../domain/restaurants'
import { restaurantPopupHtml } from './restaurantPopupHtml'

type RestaurantMapProps = {
  restaurants: Restaurant[]
  selectedId?: string
  onSelect: (restaurant: Restaurant) => void
}

const SEOUL_CITY_HALL: L.LatLngExpression = [37.5665, 126.978]

export function RestaurantMap({ restaurants, selectedId, onSelect }: RestaurantMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)

  const bounds = useMemo(() => {
    if (restaurants.length === 0) return null
    return L.latLngBounds(restaurants.map((restaurant) => [restaurant.lat, restaurant.lng]))
  }, [restaurants])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(SEOUL_CITY_HALL, 7)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const markerLayer = L.layerGroup().addTo(map)
    mapRef.current = map
    markerLayerRef.current = markerLayer

    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const markerLayer = markerLayerRef.current
    if (!markerLayer) return

    markerLayer.clearLayers()

    restaurants.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedId
      const marker = L.marker([restaurant.lat, restaurant.lng], {
        icon: L.divIcon({
          className: `restaurant-marker${isSelected ? ' restaurant-marker--selected' : ''}`,
          html: '<span aria-hidden="true">🍽️</span>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -30],
        }),
        title: restaurant.name,
      })

      marker.bindPopup(restaurantPopupHtml(restaurant))
      marker.on('click', () => onSelect(restaurant))
      marker.addTo(markerLayer)

      if (isSelected) {
        marker.openPopup()
      }
    })
  }, [onSelect, restaurants, selectedId])

  useEffect(() => {
    if (!mapRef.current || !bounds) return
    mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [bounds])

  return <div ref={mapElementRef} className="restaurant-map" aria-label="백년가게 식당 지도" />
}
