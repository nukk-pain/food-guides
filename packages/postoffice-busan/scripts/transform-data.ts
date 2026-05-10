/**
 * Transform raw extraction (data/raw/postoffice-busan-2025.json) into the
 * static dataset the app reads (public/data/restaurants.json).
 *
 *  - Adds lat/lng = null placeholders (filled later by geocoder).
 *  - Re-prefixes image paths from "images/..." to keep them resolvable
 *    via public/data/images/<file>.
 *  - Pulls geocoded coordinates from data/geocode-cache.json when present.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(__dirname, '..')
const RAW = resolve(PKG, 'data/raw/postoffice-busan-2025.json')
const CACHE = resolve(PKG, 'data/geocode-cache.json')
const OUT = resolve(PKG, 'public/data/restaurants.json')

type RawRow = {
  id: string
  region: string
  postOffice: string
  postOfficeArea: string | null
  recommendationNo: number
  name: string
  description: string
  menu: string
  address: string
  phone: string
  hours: string
  pdfPage: number
  images: string[]
}

type Raw = {
  metadata: Record<string, unknown>
  restaurants: RawRow[]
}

type GeocodeCache = Record<string, { lat: number; lng: number; provider: string; geocodedAt: string }>

type AppRow = RawRow & { lat: number | null; lng: number | null }

function main(): void {
  const raw = JSON.parse(readFileSync(RAW, 'utf8')) as Raw
  const cache: GeocodeCache = existsSync(CACHE)
    ? (JSON.parse(readFileSync(CACHE, 'utf8')) as GeocodeCache)
    : {}

  const rows: AppRow[] = raw.restaurants.map((r) => {
    const cached = cache[r.address]
    return {
      ...r,
      lat: cached?.lat ?? null,
      lng: cached?.lng ?? null,
    }
  })

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(rows, null, 2), 'utf8')

  const placed = rows.filter((r) => r.lat != null && r.lng != null).length
  console.log(`Wrote ${rows.length} rows to public/data/restaurants.json`)
  console.log(`  ${placed}/${rows.length} have coordinates (cache hits)`)
}

main()
