import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self'`,
  `font-src 'self' https://*.basemaps.cartocdn.com`,
  `style-src 'self' https://api.mapbox.com 'unsafe-inline'`,
  `worker-src blob:`,
  `img-src 'self' data: blob: rwsos-dataservices-ont.avi.deltares.nl`,
  `child-src blob:`,
  `connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://*.mapbox.com https://rwsos-dataservices-ont.avi.deltares.nl`,
]

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      'content-security-policy': contentSecurityPolicy.join('; '),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'schematic-status-display',
          // ...
        },
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@deltares/fews-ssd-webcomponent'],
  },
})
