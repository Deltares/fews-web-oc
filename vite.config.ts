import { defineConfig, loadEnv } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import eslint from 'vite-plugin-eslint'
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {// vite config
    // Specify the base URL for the application
    base: env.NODE_ENV === 'production'
      ? env.VITE_APP_PUBLIC_PATH || '/'
      : '/',

    // Ensure the @ import alias still works
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // Specify packages that need to be transpiled
    optimizeDeps: {
      include: ['vuetify'],
    },

    // Enable/disable source maps for production build
    build: {
      sourcemap: true,
    },

    // Configure the server options
    server: {
      // Proxy settings for the development server
      proxy: {
        '/iwp/FewsWebServices/': {
          target: 'https://rwsos-dataservices-ont.avi.deltares.nl',
          changeOrigin: true,
        },
      },
    },

    // Configure the plugins
    plugins: [
      createVuePlugin(),
      eslint(),
      Components({
        resolvers: [
          // Vue2MapboxGL
          (componentName) => {
            // where `componentName` is always CapitalCase
            if (componentName.startsWith('VMapbox'))
              return { name: componentName, from: 'vue2mapbox-gl' }
          },
          // Vuetify
          VuetifyResolver(),
        ]
      })
    ],
  }
})
