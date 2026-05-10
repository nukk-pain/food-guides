/**
 * Geocode all 245 postoffice-busan restaurant addresses via Kakao Local API.
 *
 * Reads:  data/raw/postoffice-busan-2025.json
 * Writes: data/geocode-cache.json (incremental — only fetches cache misses)
 *
 * Key resolution (in order):
 *   1. KAKAO_REST_API_KEY env var
 *   2. <package>/.env  (KAKAO_REST_API_KEY=...)
 *   3. ~/.openclaw/.kakao_rest_api_key (chmod 600 file)
 *
 * Cache shape:
 *   {
 *     "<address>": {
 *       "lat": 35.18, "lng": 129.07,
 *       "provider": "kakao",
 *       "geocodedAt": "2026-05-10T..."
 *     },
 *     "<unresolved address>": { "miss": true, "provider": "kakao", "checkedAt": "..." }
 *   }
 *
 * After running, also runs transform-data so public/data/restaurants.json
 * picks up the new coordinates.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import {
  geocodeAddressWithKakao,
  geocodePlaceWithKakao,
  type GeocodePoint,
} from './kakaoGeocoder.ts'
import { geocodeWithNaver, loadNaverCredentials } from './naverGeocoder.ts'
// arcgisGeocoder.ts is intentionally NOT imported — its results were unreliable
// (returned identical coordinates for distinct restaurants in the 동부산구 case).
// File is retained for future evaluation or last-resort use.

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(__dirname, '..')
const RAW = resolve(PKG, 'data/raw/postoffice-busan-2025.json')
const CACHE = resolve(PKG, 'data/geocode-cache.json')
const PACKAGE_ENV = resolve(PKG, '.env')
const OPENCLAW_KEY_FILE = resolve(homedir(), '.openclaw/.kakao_rest_api_key')

type RawRow = { address: string; name: string; postOffice: string; recommendationNo: number }
type Raw = { restaurants: RawRow[] }

type Provider = 'kakao' | 'kakao-keyword' | 'naver'
type Hit = { lat: number; lng: number; provider: Provider; geocodedAt: string; matchedQuery?: string }
type Miss = { miss: true; provider: Provider; checkedAt: string }
type CacheEntry = Hit | Miss
type Cache = Record<string, CacheEntry>

function readDotenvKey(file: string, name: string): string | null {
  if (!existsSync(file)) return null
  const text = readFileSync(file, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i)
    if (!m || m[1] !== name) continue
    let value = m[2].trim()
    // strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value || null
  }
  return null
}

function loadKey(): string {
  const fromEnv = process.env.KAKAO_REST_API_KEY
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()

  const fromPackageEnv = readDotenvKey(PACKAGE_ENV, 'KAKAO_REST_API_KEY')
  if (fromPackageEnv) return fromPackageEnv

  if (existsSync(OPENCLAW_KEY_FILE)) {
    const value = readFileSync(OPENCLAW_KEY_FILE, 'utf8').trim()
    if (value) return value
  }

  throw new Error(
    `KAKAO_REST_API_KEY not found. Set env var, write to ${PACKAGE_ENV} as 'KAKAO_REST_API_KEY=...', or to ${OPENCLAW_KEY_FILE} (chmod 600).`,
  )
}

function loadCache(): Cache {
  if (!existsSync(CACHE)) return {}
  const value = JSON.parse(readFileSync(CACHE, 'utf8'))
  return typeof value === 'object' && value !== null ? (value as Cache) : {}
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8')
}

function isHit(entry: CacheEntry | undefined): entry is Hit {
  return !!entry && 'lat' in entry && Number.isFinite(entry.lat)
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const DELAY_MS = Number(process.env.GEOCODE_DELAY_MS ?? 120)
const RETRY_MISSES = process.env.GEOCODE_RETRY_MISSES === '1'

function buildKeywordQuery(row: RawRow): string {
  // 식당명 + (도로명 첫 토큰까지)로 키워드 검색.
  // 예: '구자윤 과자점 부산광역시 수영구', '외양간구시 경남 거창군'
  const tokens = row.address.split(/\s+/)
  const locality = tokens.slice(0, 3).join(' ')
  return `${row.name} ${locality}`.trim()
}

async function main(): Promise<void> {
  const apiKey = loadKey()
  const raw = JSON.parse(readFileSync(RAW, 'utf8')) as Raw
  const cache = loadCache()

  // Dedup addresses
  const addresses: string[] = [...new Set(raw.restaurants.map((r) => r.address))]
  const targets = addresses.filter((addr) => {
    const entry = cache[addr]
    if (isHit(entry)) return false
    if (entry && !RETRY_MISSES) return false // skip miss unless asked
    return true
  })

  console.log(
    `Total: ${addresses.length} unique addresses. Already resolved: ${
      addresses.filter((a) => isHit(cache[a])).length
    }. To geocode this run: ${targets.length}.`,
  )

  let hits = 0
  let misses = 0
  let errors = 0

  for (let i = 0; i < targets.length; i++) {
    const address = targets[i]
    try {
      const point: GeocodePoint | null = await geocodeAddressWithKakao(address, apiKey)
      if (point) {
        cache[address] = {
          lat: point.lat,
          lng: point.lng,
          provider: 'kakao',
          geocodedAt: new Date().toISOString(),
        }
        hits++
        console.log(`  ✓ [${i + 1}/${targets.length}] ${address} → ${point.lat}, ${point.lng}`)
      } else {
        cache[address] = { miss: true, provider: 'kakao', checkedAt: new Date().toISOString() }
        misses++
        console.warn(`  · [${i + 1}/${targets.length}] ${address} → no result`)
      }
    } catch (err) {
      errors++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ [${i + 1}/${targets.length}] ${address} — ${msg}`)
      // If we get an auth/permission error early on, abort fast (don't burn 245 calls).
      if (errors === 1 && /403|401/.test(msg)) {
        console.error(`Aborting after first auth error — verify KAKAO_REST_API_KEY and 'OPEN_MAP_AND_LOCAL' service.`)
        break
      }
    }
    // periodic flush so a crash doesn't lose progress
    if ((i + 1) % 25 === 0) saveCache(cache)
    await delay(DELAY_MS)
  }

  saveCache(cache)
  console.log(`\nAddress pass: hits=${hits}, misses=${misses}, errors=${errors}.`)

  // Keyword fallback for misses, keyed by restaurant rather than address —
  // a name+locality query can rescue cases where Kakao address index is incomplete.
  const stillMissing = raw.restaurants.filter((r) => !isHit(cache[r.address]))
  if (stillMissing.length > 0) {
    console.log(`\nKeyword fallback: ${stillMissing.length} restaurant(s) without coords.`)
    let kwHits = 0
    let kwMisses = 0
    for (const row of stillMissing) {
      const query = buildKeywordQuery(row)
      try {
        const point = await geocodePlaceWithKakao(query, apiKey)
        if (point) {
          cache[row.address] = {
            lat: point.lat,
            lng: point.lng,
            provider: 'kakao-keyword',
            geocodedAt: new Date().toISOString(),
            matchedQuery: query,
          }
          kwHits++
          console.log(`  ✓ ${row.name} (${row.address}) via keyword "${query}" → ${point.lat}, ${point.lng}`)
        } else {
          kwMisses++
          console.warn(`  · ${row.name} (${row.address}) — keyword "${query}" → no result`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  ✗ ${row.name} (${row.address}) — ${msg}`)
      }
      await delay(DELAY_MS)
    }
    saveCache(cache)
    console.log(`Keyword pass: hits=${kwHits}, misses=${kwMisses}.`)
  }

  // Naver fallback when Kakao address + keyword both miss.
  // Query: '식당명 + 시·도 + 시·군·구' (도시 단위까지). Description-derived words
  // intentionally excluded — they led to false positives for ambiguous names
  // (e.g. '명가 감자탕' matched the wrong "명가감자탕" branch in keyword mode).
  const stillStillMissing = raw.restaurants.filter((r) => !isHit(cache[r.address]))
  if (stillStillMissing.length > 0) {
    const creds = loadNaverCredentials()
    if (!creds) {
      console.warn(
        `\nNaver fallback skipped (${stillStillMissing.length} unresolved): no credentials. ` +
          `Set NAVER_CLIENT_ID/SECRET env vars or write to ~/.openclaw/.naver_client_id + .naver_client_secret`,
      )
    } else {
      console.log(`\nNaver fallback: ${stillStillMissing.length} restaurant(s) still without coords.`)
      let nHits = 0
      let nMisses = 0
      for (const row of stillStillMissing) {
        const query = buildKeywordQuery(row)
        try {
          const point = await geocodeWithNaver(query, creds)
          if (point) {
            cache[row.address] = {
              lat: point.lat,
              lng: point.lng,
              provider: 'naver',
              geocodedAt: new Date().toISOString(),
              matchedQuery: query,
            }
            nHits++
            console.log(`  ✓ ${row.name} (${row.address}) via "${query}" → ${point.lat}, ${point.lng}`)
          } else {
            nMisses++
            console.warn(`  · ${row.name} (${row.address}) via "${query}" → no result`)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`  ✗ ${row.name} (${row.address}) — ${msg}`)
        }
        await delay(DELAY_MS)
      }
      saveCache(cache)
      console.log(`Naver pass: hits=${nHits}, misses=${nMisses}.`)
    }
  }

  console.log(`\nCache: ${CACHE}`)
  runTransform()
}

function runTransform(): void {
  console.log('\n→ Running transform-data...')
  execFileSync('npm', ['run', 'transform:data'], { cwd: PKG, stdio: 'inherit' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
