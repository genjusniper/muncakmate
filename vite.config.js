import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MuncakMate',
        short_name: 'MuncakMate',
        description: 'Aplikasi Tracker Gunung & Touring',
        theme_color: '#FC4C02',
        background_color: '#121212',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3206/3206013.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3206/3206013.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
