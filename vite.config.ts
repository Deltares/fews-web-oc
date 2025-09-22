import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { dirname, resolve } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const commitHash = execSync('git rev-parse --short HEAD').toString()
const commitTag = execSync('git tag --points-at HEAD').toString()
const buildDate = new Date().toISOString()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __GIT_HASH__: JSON.stringify(commitHash),
      __GIT_TAG__: JSON.stringify(commitTag),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'maplibre-gl': ['maplibre-gl'],
            'fews-web-oc-charts': ['@deltares/fews-web-oc-charts'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/FewsWebServices/': `${env.DEV_SERVER_PROXY_FEWS_PI}`,
      },
      headers: {
        'content-security-policy': [
          `default-src 'none'`,
          `script-src 'self' blob:`,
          `font-src 'self' ${env.VITE_FEWS_WEBSERVICES_URL}`,
          `style-src 'self' blob: ${env.VITE_FEWS_WEBSERVICES_URL} 'unsafe-inline'`, // vuetify
          `worker-src blob:`, // maplibre-gl
          `img-src 'self' data: blob: ${env.VITE_FEWS_WEBSERVICES_URL}`, // FEWS webservices
          [
            `connect-src`,
            `'self'`,
            `https://basemaps.cartocdn.com`,
            `https://*.basemaps.cartocdn.com`,
            `https://login.microsoftonline.com`,
            `${env.VITE_FEWS_WEBSERVICES_URL}`,
            `${env.DEV_CONNECT_SRC}`,
          ].join(' '), // FEWS webservices, Authentication, Basemaps
          [
            `frame-src`,
            `'self'`,
            `blob:`,
            `${env.VITE_FEWS_WEBSERVICES_URL}`,
            `${env.DEV_FRAME_SRC}`,
          ].join(' '),
        ].join('; '),
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        'vuetify/labs/VNumberInput': resolve(
          __dirname,
          'node_modules/vuetify/lib/components/VNumberInput/index.js',
        ),
        'vuetify/labs/VTimePicker': resolve(
          __dirname,
          'node_modules/vuetify/lib/components/VTimePicker/index.js',
        ),
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
      mode === 'production'
        ? vuetify({
            styles: {
              configFile: resolve(__dirname, './src') + '/styles/settings.scss',
            },
          })
        : vuetify(),
    ],
    optimizeDeps: {
      exclude: ['@deltares/fews-ssd-webcomponent', 'vuetify'],
    },
    test: {
      include: ['**/*.test.?(c|m)[jt]s?(x)'],
    },
  }
})
