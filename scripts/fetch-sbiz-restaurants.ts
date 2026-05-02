import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import {
  buildSbizListPayload,
  geocodeQueryVariants,
  parseSbizListPage,
  toPublicRestaurantRows,
  toRawRestaurantRows,
  type GeocodeCache,
  type GeocodePoint,
  type SbizListRow,
  SBIZ_LIST_URL,
} from '../src/sbiz/parser'

type CliOptions = {
  maxPages?: number
  geocode: boolean
  geocodeLimit?: number
  delayMs: number
}

const RAW_OUTPUT_PATH = 'data/raw/sbiz-restaurants.json'
const GEOCODE_CACHE_PATH = 'data/geocode-cache.json'
const PUBLIC_OUTPUT_PATH = 'public/data/restaurants.json'
const USER_AGENT = 'baeknyeon-restaurant-map/0.1 (https://www.sbiz.or.kr/hdst/main/ohndMarketList.do)'

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await fetchAllRestaurantRows(options)
  await writeJson(RAW_OUTPUT_PATH, toRawRestaurantRows(rows))

  const cache = await readGeocodeCache()
  if (options.geocode) {
    await geocodeMissingAddresses(rows, cache, options)
    await writeJson(GEOCODE_CACHE_PATH, cache)
  }

  const publicRows = toPublicRestaurantRows(rows, cache)
  if (publicRows.length > 0) {
    await writeJson(PUBLIC_OUTPUT_PATH, publicRows)
  }

  console.log(
    JSON.stringify(
      {
        rawRows: rows.length,
        geocodedRows: publicRows.length,
        rawOutput: RAW_OUTPUT_PATH,
        geocodeCache: GEOCODE_CACHE_PATH,
        publicOutput: publicRows.length > 0 ? PUBLIC_OUTPUT_PATH : 'unchanged: no geocoded rows available',
      },
      null,
      2,
    ),
  )
}

async function fetchAllRestaurantRows(options: CliOptions): Promise<SbizListRow[]> {
  const firstPage = await fetchListPage(1)
  const firstParsed = parseSbizListPage(firstPage)
  const totalPages = Math.min(firstParsed.totalPages, options.maxPages ?? firstParsed.totalPages)
  const rows = [...firstParsed.rows]

  for (let page = 2; page <= totalPages; page += 1) {
    await delay(options.delayMs)
    const html = await fetchListPage(page)
    const parsed = parseSbizListPage(html)
    rows.push(...parsed.rows)
    console.log(`Fetched page ${page}/${totalPages}: ${parsed.rows.length} rows`)
  }

  return dedupeRows(rows)
}

async function fetchListPage(page: number): Promise<string> {
  const response = await fetch(SBIZ_LIST_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      referer: SBIZ_LIST_URL,
      'user-agent': USER_AGENT,
    },
    body: buildSbizListPayload({ page }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sbiz list page ${page}: HTTP ${response.status}`)
  }

  return response.text()
}

async function geocodeMissingAddresses(rows: SbizListRow[], cache: GeocodeCache, options: CliOptions) {
  const missingAddresses = [...new Set(rows.map((row) => row.address).filter((address) => !cache[address]))]
  const limit = options.geocodeLimit ?? missingAddresses.length

  for (const [index, address] of missingAddresses.slice(0, limit).entries()) {
    await delay(Math.max(options.delayMs, 1100))
    const point = await geocodeAddress(address)
    if (point) {
      cache[address] = point
      console.log(`Geocoded ${index + 1}/${limit}: ${address} -> ${point.lat}, ${point.lng}`)
    } else {
      console.warn(`No geocode result: ${address}`)
    }
  }
}

async function geocodeAddress(address: string): Promise<GeocodePoint | null> {
  for (const query of geocodeQueryVariants(address)) {
    const point = await geocodeQuery(query)
    if (point) return point
    await delay(1100)
  }

  return null
}

async function geocodeQuery(query: string): Promise<GeocodePoint | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'kr')
  url.searchParams.set('q', query)

  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      referer: SBIZ_LIST_URL,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to geocode ${query}: HTTP ${response.status}`)
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>
  const first = results[0]
  if (!first) return null

  return { lat: Number(first.lat), lng: Number(first.lon) }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { geocode: false, delayMs: 250 }

  for (const arg of args) {
    if (arg === '--geocode') options.geocode = true
    if (arg.startsWith('--max-pages=')) options.maxPages = Number(arg.replace('--max-pages=', ''))
    if (arg.startsWith('--geocode-limit=')) options.geocodeLimit = Number(arg.replace('--geocode-limit=', ''))
    if (arg.startsWith('--delay-ms=')) options.delayMs = Number(arg.replace('--delay-ms=', ''))
  }

  return options
}

async function readGeocodeCache(): Promise<GeocodeCache> {
  if (!existsSync(GEOCODE_CACHE_PATH)) return {}
  return JSON.parse(await readFile(GEOCODE_CACHE_PATH, 'utf8')) as GeocodeCache
}

async function writeJson(path: string, data: unknown) {
  const directory = path.split('/').slice(0, -1).join('/')
  await mkdir(directory, { recursive: true })
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`)
}

function dedupeRows(rows: SbizListRow[]): SbizListRow[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
