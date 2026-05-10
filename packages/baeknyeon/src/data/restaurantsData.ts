export function restaurantsDataUrl(baseUrl = import.meta.env.BASE_URL): string {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalizedBaseUrl}data/restaurants.json`
}

/**
 * Returns the URL of the parent landing page. In production (BASE_URL like
 * "/food-guides/baeknyeon/") this is "/food-guides/"; locally (BASE_URL "/")
 * it falls back to "/".
 */
export function homeUrl(baseUrl = import.meta.env.BASE_URL): string {
  const trimmed = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const parent = trimmed.replace(/\/[^/]*$/, '/')
  return parent || '/'
}
