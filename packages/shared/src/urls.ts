/**
 * Resolve the URL of restaurants.json relative to the current Vite base.
 * Each package keeps its dataset under `<base>/data/restaurants.json`.
 */
export function restaurantsDataUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalized}data/restaurants.json`
}

/**
 * Resolve a relative image path against the current Vite base.
 * Used by guides that ship per-restaurant photos in `<base>/data/images/`.
 */
export function imageUrl(relPath: string, baseUrl: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${normalized}data/${relPath.replace(/^\/+/, '')}`
}

/**
 * URL of the parent landing page. Production base "/food-guides/baeknyeon/"
 * yields "/food-guides/"; dev base "/" stays "/".
 */
export function homeUrl(baseUrl: string): string {
  const trimmed = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const parent = trimmed.replace(/\/[^/]*$/, '/')
  return parent || '/'
}
