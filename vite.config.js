import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
  // Only use /P-O-S/ base path for production builds (GitHub Pages)
  // Use / for local development
  const base = command === 'build' ? '/P-O-S/' : '/'
  
  return {
    base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'POS System',
        short_name: 'POS',
        description: 'Point of Sale System with Google Sheets Backend',
        theme_color: '#1f2937',
        background_color: '#1f2937',
        display: 'standalone',
        orientation: 'any',
        start_url: command === 'build' ? '/P-O-S/' : '/',
        scope: command === 'build' ? '/P-O-S/' : '/',
        icons: [
          {
            src: command === 'build' ? '/P-O-S/pwa-192x192.png' : '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: command === 'build' ? '/P-O-S/pwa-512x512.png' : '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
    server: {
      port: 3000,
      open: true
    }
  }
})

