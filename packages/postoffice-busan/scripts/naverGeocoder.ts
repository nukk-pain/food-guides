// Naver Local Search API geocoder — fallback used when Kakao address + keyword
// both miss. Returns the first place's coordinates.
//
// Naver Local Search returns coords as integer-encoded WGS84:
//   mapx = longitude × 10^7   (e.g. "1290604243" → 129.0604243)
//   mapy = latitude  × 10^7
//
// Auth: ~/.openclaw/.naver_client_id + ~/.openclaw/.naver_client_secret (chmod 600)
//        or NAVER_CLIENT_ID + NAVER_CLIENT_SECRET env vars.

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'

export type GeocodePoint = { lat: number; lng: number }

const NAVER_LOCAL_ENDPOINT = 'https://openapi.naver.com/v1/search/local.json'

export type NaverCredentials = { clientId: string; clientSecret: string }

export function loadNaverCredentials(): NaverCredentials | null {
  const envId = process.env.NAVER_CLIENT_ID?.trim()
  const envSecret = process.env.NAVER_CLIENT_SECRET?.trim()
  if (envId && envSecret) return { clientId: envId, clientSecret: envSecret }

  const idFile = resolve(homedir(), '.openclaw/.naver_client_id')
  const secretFile = resolve(homedir(), '.openclaw/.naver_client_secret')
  if (existsSync(idFile) && existsSync(secretFile)) {
    return {
      clientId: readFileSync(idFile, 'utf8').trim(),
      clientSecret: readFileSync(secretFile, 'utf8').trim(),
    }
  }
  return null
}

export async function geocodeWithNaver(
  query: string,
  creds: NaverCredentials,
): Promise<GeocodePoint | null> {
  const url = new URL(NAVER_LOCAL_ENDPOINT)
  url.searchParams.set('query', query)
  url.searchParams.set('display', '5')
  url.searchParams.set('sort', 'comment')

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': creds.clientId,
      'X-Naver-Client-Secret': creds.clientSecret,
    },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `Naver Local API request failed: HTTP ${response.status}${body ? ` ${body}` : ''}`,
    )
  }

  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> }
  const first = payload.items?.[0]
  if (!first) return null

  const mapx = Number(first.mapx)
  const mapy = Number(first.mapy)
  if (!Number.isFinite(mapx) || !Number.isFinite(mapy)) return null

  const lng = mapx / 1e7
  const lat = mapy / 1e7
  if (!isWgs84KoreaPoint(lat, lng)) return null

  return { lat, lng }
}

function isWgs84KoreaPoint(lat: number, lng: number): boolean {
  return lat >= 30 && lat <= 45 && lng >= 120 && lng <= 140
}
