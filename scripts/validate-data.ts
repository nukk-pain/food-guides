import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRestaurantDataManifest, validateRestaurantData, type RestaurantDataManifest } from '../src/data/validateRestaurantData'
import type { Restaurant } from '../src/domain/restaurants'

const PUBLIC_DATA_PATH = 'public/data/restaurants.json'
const MANIFEST_PATH = 'data/manifest.json'

async function main() {
  const writeManifest = process.argv.includes('--write-manifest')
  const jsonText = await readFile(PUBLIC_DATA_PATH, 'utf8')
  const rows = JSON.parse(jsonText) as unknown
  const validation = validateRestaurantData(rows)

  if (!validation.ok) {
    console.error('Restaurant data validation failed:')
    for (const error of validation.errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  const sha256 = sha256Hex(jsonText)
  const restaurantRows = rows as Restaurant[]
  const manifest = createRestaurantDataManifest(restaurantRows, sha256)

  if (writeManifest) {
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  } else {
    await validateManifest(manifest)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: restaurantRows.length,
        sha256,
        manifest: writeManifest ? 'written' : 'verified',
      },
      null,
      2,
    ),
  )
}

async function validateManifest(actual: RestaurantDataManifest) {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as RestaurantDataManifest
  const errors: string[] = []

  if (manifest.schemaVersion !== actual.schemaVersion) errors.push(`manifest schemaVersion mismatch: ${manifest.schemaVersion}`)
  if (manifest.source !== actual.source) errors.push(`manifest source mismatch: ${manifest.source}`)
  if (manifest.count !== actual.count) errors.push(`manifest count ${manifest.count} does not match data count ${actual.count}`)
  if (manifest.sha256 !== actual.sha256) errors.push('manifest sha256 does not match public data')
  if (Number.isNaN(Date.parse(manifest.generatedAt))) errors.push('manifest generatedAt is not a valid date')

  if (errors.length > 0) {
    console.error('Restaurant data manifest validation failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
  }
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
