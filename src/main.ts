import { createApp } from 'vue'
import App from './App.vue'
import { configManager } from './services/application-config'
import { authenticationManager } from './services/authentication/AuthenticationManager.js'
import router from './router/index.js'
import vuetify from './plugins/vuetify.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { defineCustomElements } from '@deltares/fews-ssd-webcomponent/loader'
import 'maplibre-gl/dist/maplibre-gl.css'

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  const { worker } = await import('../mocks/browser')
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest(request, print) {
      // Only print warnings on requests to our own mock server
      if (request.url.includes('mockserver.dev')) {
        print.warning()
      } else {
        return
      }
    },
  })
}

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
    if (import.meta.env.DEV) {
      await enableMocking()
    }
    configManager.update(data)
    if (configManager.authenticationIsEnabled) {
      await authenticationManager.init(configManager.getUserManagerSettings())
    }
    app.use(router)
    app.mount('#app')
  })
