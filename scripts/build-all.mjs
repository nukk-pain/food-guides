/**
 * Build every workspace package + landing into a single dist/ that GitHub Pages
 * serves as one site:
 *
 *   dist/
 *     index.html                    landing
 *     assets/
 *     baeknyeon/
 *     postoffice-busan/
 *
 * Each package is built with VITE_BASE_PATH=/<repo>/<slug>/, and the landing
 * with /<repo>/. Repo name comes from GITHUB_REPOSITORY in CI (otherwise falls
 * back to 'food-guides' for local builds).
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'food-guides'
const BASE_PREFIX = process.env.NO_BASE_PATH === '1' ? '/' : `/${REPO_NAME}/`

const packages = [
  { name: 'baeknyeon', slug: 'baeknyeon', dir: 'packages/baeknyeon' },
  { name: 'postoffice-busan', slug: 'postoffice-busan', dir: 'packages/postoffice-busan' },
]

console.log(`food-guides build → ${DIST}`)
console.log(`  base prefix: ${BASE_PREFIX}`)

if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true })
mkdirSync(DIST, { recursive: true })

for (const p of packages) {
  const base =
    BASE_PREFIX === '/' ? `/${p.slug}/` : `${BASE_PREFIX}${p.slug}/`
  console.log(`\n→ ${p.name} (base=${base})`)
  execSync('npm run build', {
    cwd: resolve(ROOT, p.dir),
    env: { ...process.env, VITE_BASE_PATH: base },
    stdio: 'inherit',
  })
  cpSync(resolve(ROOT, p.dir, 'dist'), resolve(DIST, p.slug), {
    recursive: true,
    dereference: true,
  })
}

console.log(`\n→ landing (base=${BASE_PREFIX})`)
execSync('npm run build', {
  cwd: resolve(ROOT, 'landing'),
  env: { ...process.env, VITE_BASE_PATH: BASE_PREFIX },
  stdio: 'inherit',
})
cpSync(resolve(ROOT, 'landing/dist'), DIST, { recursive: true, dereference: true })

console.log(`\n✓ build:all complete. Output: ${DIST}`)
