import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({ template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'schematic-status-display'
        // ...
      },
    }}
  )],
  optimizeDeps: {
    exclude: ['@deltares/fews-ssd-webcomponent']
  }
})
