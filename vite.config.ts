import { defineConfig } from 'vite'
import pluginRewriteAll from 'vite-plugin-rewrite-all'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
    pluginRewriteAll(),
  ],
  optimizeDeps: {
    exclude: ['@deltares/fews-ssd-webcomponent'],
  },
})
