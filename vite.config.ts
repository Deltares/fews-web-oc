import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      headers: {
        'content-security-policy': [
          `default-src 'self'`,
          `script-src 'self'`,
          `font-src 'self' https://*.basemaps.cartocdn.com`,
          `style-src 'self' https://api.mapbox.com 'unsafe-inline'`,
          `worker-src blob:`,
          `img-src 'self' data: blob: ${env.VITE_FEWS_WEBSERVICES_URL}`,
          `child-src blob:`,
          `connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://*.mapbox.com ${env.VITE_FEWS_WEBSERVICES_URL}`,
        ].join('; '),
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
  }
})
