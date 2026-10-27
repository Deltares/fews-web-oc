// playwright/vite.config.ts
import { defineConfig, type Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve, sep } from 'node:path'

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
        const path = decodeURIComponent(req.url?.split('?')[0] ?? '')
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
