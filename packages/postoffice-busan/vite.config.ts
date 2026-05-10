import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Monorepo deploy lays each package under /<repo>/<package>/.
// Local dev keeps base at '/'. Workflow injects VITE_BASE_PATH for prod.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
})
