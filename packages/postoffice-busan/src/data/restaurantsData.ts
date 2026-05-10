import {
  homeUrl as sharedHomeUrl,
  imageUrl as sharedImageUrl,
  restaurantsDataUrl as sharedRestaurantsDataUrl,
} from '@food-guides/shared/urls'

export function restaurantsDataUrl(baseUrl = import.meta.env.BASE_URL): string {
  return sharedRestaurantsDataUrl(baseUrl)
}

export function homeUrl(baseUrl = import.meta.env.BASE_URL): string {
  return sharedHomeUrl(baseUrl)
}

export function imageUrl(relPath: string, baseUrl = import.meta.env.BASE_URL): string {
  return sharedImageUrl(relPath, baseUrl)
}
