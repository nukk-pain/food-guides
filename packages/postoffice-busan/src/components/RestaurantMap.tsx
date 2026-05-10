import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { hasCoordinates, type Restaurant } from '../domain/restaurants'
import { restaurantPopupHtml } from './restaurantPopupHtml'

type RestaurantMapProps = {
  restaurants: Restaurant[]
  selectedId?: string | null
  onSelect: (restaurant: Restaurant) => void
}

// Centered between Busan (35.18, 129.07) and 경남 mid (35.27, 128.45) — covers all 3 regions.
const DEFAULT_CENTER: L.LatLngExpression = [35.3, 128.8]

export function RestaurantMap({ restaurants, selectedId, onSelect }: RestaurantMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)

  const placeable = useMemo(() => restaurants.filter(hasCoordinates), [restaurants])

  const bounds = useMemo(() => {
    if (placeable.length === 0) return null
    return L.latLngBounds(placeable.map((r) => [r.lat as number, r.lng as number]))
  }, [placeable])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_CENTER, 9)

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

    placeable.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedId
      const marker = L.marker([restaurant.lat as number, restaurant.lng as number], {
        icon: L.divIcon({
          className: `restaurant-marker${isSelected ? ' restaurant-marker--selected' : ''}`,
          html: '<span aria-hidden="true">📮</span>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -30],
        }),
        title: restaurant.name,
      })

      marker.bindPopup(restaurantPopupHtml(restaurant))
      marker.on('click', () => {
        onSelect(restaurant)
        marker.openPopup()
      })
      marker.addTo(markerLayer)

      if (isSelected) marker.openPopup()
    })
  }, [onSelect, placeable, selectedId])

  useEffect(() => {
    if (!mapRef.current || !bounds) return
    mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [bounds])

  return <div ref={mapElementRef} className="restaurant-map" aria-label="우체국 추천 맛집 지도" />
}
