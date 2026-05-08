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
import './assets/maplibre-override.css'

import { getResourcesStaticUrl } from './lib/fews-config/index.js'
import { i18n, setI18nLanguage } from './plugins/i18n.js'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

defineCustomElements(window)
app.config.compilerOptions.isCustomElement = (tag) =>
  tag === 'schematic-status-display'

app.use(pinia)
app.use(vuetify)

fetch(`${import.meta.env.BASE_URL}app-config.json`)
  .then((res) => {
    if (!res.ok) {
      throw new Error(
        `Failed to load app-config.json (${res.status} ${res.statusText})`,
      )
    }
    return res.json()
  })
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
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    const manifestUrl = configManager.getWithDefault(
      'VITE_APP_MANIFEST_URL',
      '',
    )
    if (!manifestUrl) {
      manifestLink.href = `${import.meta.env.BASE_URL}app.webmanifest`
    } else {
      const href = getResourcesStaticUrl(manifestUrl)
      manifestLink.href = href
    }
    document.head.appendChild(manifestLink)
    if (configManager.authenticationIsEnabled) {
      authenticationManager.init(configManager.getUserManagerSettings())
    }
    const locale = configManager.getWithDefault('VITE_I18N_LOCALE', 'en-GB')
    await setI18nLanguage(i18n, locale)
    app.use(i18n)
    app.use(router)
    app.mount('#app')
  })
  .catch((err) => {
    const configError = err instanceof Error ? err : new Error(String(err))

    console.error('Config Load Error:', configError)
    if (configError.stack) {
      console.error('Config Load Error Stack:', configError.stack)
    }

    if (configError instanceof SyntaxError) {
      console.error('Reason: Invalid JSON syntax in app-config.json')
    } else if (configError instanceof TypeError) {
      console.error('Reason: Network failure while loading app-config.json')
    } else if (configError.message.includes('Failed to load app-config.json')) {
      console.error(
        'Reason: Config file missing or server returned non-200 status',
      )
    } else if (configError.message.includes('Invalid app-config.json')) {
      console.error('Reason: Invalid app-config.json content')
    } else {
      console.error('Reason: Unknown startup error')
    }

    const redirectDelayMs = import.meta.env.DEV ? 8000 : 2000
    console.error(
      `Redirecting to config-error page in ${redirectDelayMs} ms...`,
    )

    // Delay redirect so console output remains visible.
    window.setTimeout(() => {
      window.location.replace(`${import.meta.env.BASE_URL}error.html`)
    }, redirectDelayMs)
  })
