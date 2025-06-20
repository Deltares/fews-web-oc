import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { federation } from '@module-federation/vite'
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
    build: {
      target: 'chrome89',
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
      proxy: {
        '/FewsWebServices/': `${env.DEV_PROXY_FEWS_PI}`,
      },
      headers: {
        'content-security-policy': [
          `default-src 'none'`,
          `script-src 'self' blob: ${env.DEV_CSP_SCRIPT_SRC}`,
          `font-src 'self' ${env.VITE_FEWS_WEBSERVICES_URL} ${env.DEV_CSP_FONT_SRC}`,
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
            `${env.DEV_CSP_CONNECT_SRC}`,
          ].join(' '), // FEWS webservices, Authentication, Basemaps
          [`frame-src`, `'self' blob:`, `${env.DEV_CSP_FRAME_SRC}`].join(
            ' ',
          ), // FEWS webservices, Authentication, Basemaps
        ].join('; '),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'vuetify/labs/VNumberInput': path.resolve(
          __dirname,
          'node_modules/vuetify/lib/components/VNumberInput/index.js',
        ),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
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
              configFile:
                path.resolve(__dirname, './src') + '/styles/settings.scss',
            },
          })
        : vuetify(),
      federation({
        name: 'weboc_plugins',
        remotes: {
          weboc_plugins: `${env.VITE_FEWS_WEBOC_MF_MANIFEST}`,
        },
        shared: {
          vue: {
            singleton: true,
          },
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['@deltares/fews-ssd-webcomponent', 'vuetify'],
    },
    test: {
      include: ['**/*.test.?(c|m)[jt]s?(x)'],
    },
  }
})
