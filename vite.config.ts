import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import getVitePWAPlugin from './vite-pwa.config'

const commitHash = execSync('git rev-parse --short HEAD').toString()
const commitTag = execSync('git tag --points-at HEAD').toString()
const buildDate = new Date().toISOString()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const VitePWAPlugin = await getVitePWAPlugin(env, command === 'build')

  return {
    define: {
      __GIT_HASH__: JSON.stringify(commitHash),
      __GIT_TAG__: JSON.stringify(commitTag),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
    server: {
      headers: {
        'content-security-policy': [
          `default-src 'none'`,
          `manifest-src 'self'`,
          `script-src 'self'`,
          `font-src 'self'`,
          `style-src 'self' 'unsafe-inline'`, // vuetify
          `worker-src blob:`, // maplibre-gl
          `img-src 'self' data: blob: ${env.VITE_FEWS_WEBSERVICES_URL}`, // FEWS webservices
          `connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://login.microsoftonline.com ${env.VITE_FEWS_WEBSERVICES_URL}`, // FEWS webservices, Authentication, Basemaps
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
      VitePWAPlugin,
    ],
    optimizeDeps: {
      exclude: ['@deltares/fews-ssd-webcomponent'],
    },
    test: {
      include: ['**/*.test.?(c|m)[jt]s?(x)'],
    },
  }
})
