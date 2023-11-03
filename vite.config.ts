import { defineConfig } from 'vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? process.env.BASE_URL : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  plugins: [
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          isCustomElement: (tag) => tag === 'schematic-status-display',
          // ...
        },
      },
    }),
    vuetify({
      autoImport: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['@deltares/fews-ssd-webcomponent'],
  },
})
