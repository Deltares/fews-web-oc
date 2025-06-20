import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { federation } from '@module-federation/vite'

const GIT_CANDIDATE_PATHS =
  process.platform === 'win32'
    ? [
        'C:/Program Files/Git/cmd/git.exe',
        'C:/Program Files/Git/bin/git.exe',
        'C:/Program Files (x86)/Git/cmd/git.exe',
      ]
    : ['/usr/bin/git', '/usr/local/bin/git']

function runGit(args: string[], fallback = ''): string {
  try {
    const gitPath =
      process.env.GIT_EXECUTABLE ??
      GIT_CANDIDATE_PATHS.find((path) => existsSync(path))
    if (!gitPath) return fallback
    return execFileSync(gitPath, args, { encoding: 'utf8' }).trim()
  } catch {
    return fallback
  }
}

const commitHash = runGit(['rev-parse', '--short', 'HEAD'], 'unknown')
const commitTag = runGit(['tag', '--points-at', 'HEAD'])
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
        input: {
          main: 'index.html',
          error: 'error.html',
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/FewsWebServices/': `${env.DEV_PROXY_FEWS_PI}`,
      },
      headers: {
        'content-security-policy': [
          `default-src 'none'`,
          `manifest-src 'self' ${env.VITE_FEWS_WEBSERVICES_URL}`,
          `font-src 'self' ${env.VITE_FEWS_WEBSERVICES_URL} ${env.DEV_CSP_FONT_SRC}`,
          `img-src 'self' data: blob: ${env.VITE_FEWS_WEBSERVICES_URL} ${env.DEV_CSP_IMG_SRC}`, // FEWS webservices
          `media-src 'self' ${env.DEV_CSP_MEDIA_SRC}`,
          `script-src 'self' blob: ${env.DEV_SCRIPT_SRC}`,
          `style-src 'self' blob: ${env.VITE_FEWS_WEBSERVICES_URL} ${env.DEV_CSP_STYLE_SRC} 'unsafe-inline'`, // vuetify
          `worker-src blob: ${env.DEV_CSP_WORKER_SRC}`, // maplibre-gl
          [
            `connect-src`,
            `'self'`,
            `https://basemaps.cartocdn.com`,
            `https://*.basemaps.cartocdn.com`,
            `https://login.microsoftonline.com`,
            `${env.VITE_FEWS_WEBSERVICES_URL}`,
            `${env.DEV_CSP_CONNECT_SRC}`,
          ].join(' '), // FEWS webservices, Authentication, Basemaps
          [
            `frame-src`,
            `'self'`,
            `blob:`,
            `${env.VITE_FEWS_WEBSERVICES_URL}`,
            `${env.DEV_CSP_FRAME_SRC}`,
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
