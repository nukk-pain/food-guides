import type { Restaurant } from '../domain/restaurants'

export function restaurantPopupHtml(restaurant: Restaurant): string {
  return `<strong>${escapeHtml(restaurant.name)}</strong><br><small>${escapeHtml(restaurant.postOffice)}</small>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
