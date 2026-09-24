import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Алиас для импортов между слоями FSD: @/shared, @/entities, …
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Доступ к dev-серверу с других устройств локальной сети
  server: { host: true },
})
