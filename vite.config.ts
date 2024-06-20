import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const commitHash = execSync('git rev-parse --short HEAD').toString()
const commitTag = execSync('git tag --points-at HEAD').toString()
const buildDate = new Date().toISOString()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __GIT_HASH__: JSON.stringify(commitHash),
      __GIT_TAG__: JSON.stringify(commitTag),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
    server: {
      headers: {
        'content-security-policy': [
          `default-src 'self'`,
          `script-src 'self'`,
          `font-src 'self' https://*.basemaps.cartocdn.com`,
          `style-src 'self' 'unsafe-inline'`,
          `worker-src blob:`,
          `img-src 'self' data: blob: ${env.VITE_FEWS_WEBSERVICES_URL}`,
          `child-src blob:`,
          `connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://login.microsoftonline.com ${env.VITE_FEWS_WEBSERVICES_URL}`,
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
    test: {
      include: ['**/*.test.?(c|m)[jt]s?(x)'],
    },
  }
})
