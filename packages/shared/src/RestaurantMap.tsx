import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'

export type MappableRestaurant = {
  id: string
  name: string
  lat: number | null
  lng: number | null
}

export type RestaurantMapProps<T extends MappableRestaurant> = {
  restaurants: T[]
  selectedId?: string | null
  onSelect: (restaurant: T) => void
  defaultCenter: L.LatLngExpression
  defaultZoom?: number
  markerEmoji?: string
  ariaLabel: string
  buildPopupHtml: (restaurant: T) => string
}

export function RestaurantMap<T extends MappableRestaurant>({
  restaurants,
  selectedId,
  onSelect,
  defaultCenter,
  defaultZoom = 9,
  markerEmoji = '🍽️',
  ariaLabel,
  buildPopupHtml,
}: RestaurantMapProps<T>) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)

  const placeable = useMemo(
    () => restaurants.filter((r): r is T & { lat: number; lng: number } => r.lat != null && r.lng != null),
    [restaurants],
  )

  const bounds = useMemo(() => {
    if (placeable.length === 0) return null
    return L.latLngBounds(placeable.map((r) => [r.lat, r.lng]))
  }, [placeable])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(defaultCenter, defaultZoom)

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
    // defaultCenter / defaultZoom intentionally only consumed on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const markerLayer = markerLayerRef.current
    if (!markerLayer) return

    markerLayer.clearLayers()

    placeable.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedId
      const marker = L.marker([restaurant.lat, restaurant.lng], {
        icon: L.divIcon({
          className: `restaurant-marker${isSelected ? ' restaurant-marker--selected' : ''}`,
          html: `<span aria-hidden="true">${markerEmoji}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -30],
        }),
        title: restaurant.name,
      })

      marker.bindPopup(buildPopupHtml(restaurant))
      marker.on('click', () => {
        onSelect(restaurant)
        marker.openPopup()
      })
      marker.addTo(markerLayer)

      if (isSelected) marker.openPopup()
    })
  }, [onSelect, placeable, selectedId, markerEmoji, buildPopupHtml])

  useEffect(() => {
    if (!mapRef.current || !bounds) return
    mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [bounds])

  return <div ref={mapElementRef} className="restaurant-map" aria-label={ariaLabel} />
}
