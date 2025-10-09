import { createApp } from 'vue'
import App from './App.vue'
import { configManager } from './services/application-config'
import { authenticationManager } from './services/authentication/AuthenticationManager.js'
import router from './router/index.js'
import vuetify from './plugins/vuetify.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { defineCustomElements } from '@deltares/fews-ssd-webcomponent/loader'
import { init } from '@module-federation/enhanced/runtime'
import 'maplibre-gl/dist/maplibre-gl.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

defineCustomElements(window)
app.config.compilerOptions.isCustomElement = (tag) =>
  tag === 'schematic-status-display'

app.use(pinia)
app.use(vuetify)

fetch(`${import.meta.env.BASE_URL}app-config.json`)
  .then((res) => res.json())
  .then(async (data) => {
    configManager.update(data)
    if (configManager.authenticationIsEnabled) {
      await authenticationManager.init(configManager.getUserManagerSettings())
    }
    const remoteManifest = configManager.get('VITE_FEWS_WEBOC_MF_MANIFEST_URL')
    if (remoteManifest) {
      console.log(`Loading remote manifest from: ${remoteManifest}`)
      const initOptions = {
        name: 'weboc-micro-frontend',
        remotes: [
          {
            // mf-manifest.json is a file type generated in the new version of Module Federation build tools, providing richer functionality compared to remoteEntry
            // Preloading depends on the use of the mf-manifest.json file type
            name: 'mdba-micro-frontend',
            entry: remoteManifest,
          },
        ],
      }
      init(initOptions)
    }
    app.use(router)
    app.mount('#app')
  })
