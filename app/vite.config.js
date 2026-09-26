import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/sistema-financeiro-familiar/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'pwa-maskable.svg'],
      manifest: {
        name: 'Jeferson & Raquel · Controle Financeiro',
        short_name: 'Financeiro',
        description: 'Controle financeiro da família — lançamentos, cartões, parcelamentos, orçamentos, metas e relatórios.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#7B61FF',
        background_color: '#7B61FF',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/supabase\.co/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
