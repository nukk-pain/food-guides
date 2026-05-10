import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production, served as the root of the food-guides Pages site, so
// VITE_BASE_PATH is /<repo>/. Locally, base = '/'.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
})
