// playwright/vite.config.ts
import { defineConfig, type Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve, sep } from 'node:path'

/** Outside the 517x range Vite falls back to when 5173 is in use */
export const CT_SERVER_PORT = 6173

/**
 * Serve the CSS files in tests/fixtures/dynamic-report/static as FEWS static
 * resources, for the DynamicReportContent stories.
 */
function fewsStaticResources(): Plugin {
  const prefix = '/test-fews/rest/fewspiservice/v1/resources/static/'
  const root = resolve(
    import.meta.dirname,
    'tests/fixtures/dynamic-report/static',
  )
  return {
    name: 'fews-static-resources',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let path: string
        try {
          path = decodeURIComponent(req.url?.split('?')[0] ?? '')
        } catch {
          return next()
        }
        if (!path.startsWith(prefix) || !path.endsWith('.css')) return next()
        const file = resolve(root, path.slice(prefix.length))
        // Do not serve files outside the fixtures folder
        if (!file.startsWith(root + sep)) return next()
        try {
          const css = await readFile(file)
          res.setHeader('Content-Type', 'text/css')
          res.end(css)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  // Do not load the local .env files, e.g. an .env.development that enables
  // authentication. The stories configure what they need themselves.
  envDir: false,
  server: {
    port: CT_SERVER_PORT,
    // Fail instead of moving to another port that Playwright does not know
    strictPort: true,
  },
  plugins: [
    fewsStaticResources(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'schematic-status-display',
          // ...
        },
      },
    }),
    vuetify(),
  ],
  optimizeDeps: {
    exclude: ['@deltares/fews-ssd-webcomponent', 'vuetify'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@weboc/module-federation': resolve(
        import.meta.dirname,
        './src/lib/moduleFederation/standalone.ts',
      ),
      'vuetify/labs/VNumberInput': resolve(
        import.meta.dirname,
        'node_modules/vuetify/lib/components/VNumberInput/index.js',
      ),
      'vuetify/labs/VTimePicker': resolve(
        import.meta.dirname,
        'node_modules/vuetify/lib/components/VTimePicker/index.js',
      ),
      'vuetify/labs/VStepperVertical': resolve(
        import.meta.dirname,
        'node_modules/vuetify/lib/components/VStepperVertical/index.js',
      ),
    },
  },
})
