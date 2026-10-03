// playwright/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
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
