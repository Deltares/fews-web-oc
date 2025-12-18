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
import { getResourcesStaticUrl } from './lib/fews-config/index.js'

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
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    const resource = configManager.getWithDefault(
      'VITE_LOGIN_STYLESHEET_URL',
      '',
    )
    if (!resource) {
      link.href = `${import.meta.env.BASE_URL}css/login.css`
    } else {
      const href = getResourcesStaticUrl(resource)
      link.href = href
    }
    document.head.appendChild(link)
    if (configManager.authenticationIsEnabled) {
      await authenticationManager.init(configManager.getUserManagerSettings())
    }
    app.use(router)
    app.mount('#app')
  })
