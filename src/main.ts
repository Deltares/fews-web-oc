import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { configManager } from './services/application-config'
import { authenticationManager } from './services/authentication/AuthenticationManager.js'
import router from './router/index.js'
import vuetify from './plugins/vuetify.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { defineCustomElements } from '@deltares/fews-ssd-webcomponent/loader'
import 'maplibre-gl/dist/maplibre-gl.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const loadLocaleMessages = async (locale: string) => {
  const response = await fetch(
    `${import.meta.env.BASE_URL}locales/${locale}.json`,
  )
  return response.json()
}

const localeMessages = async () => {
  let result: any = {}
  result.de_DE = await loadLocaleMessages('de_DE')
  result.en_EN = await loadLocaleMessages('en_EN')
  return result
}

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
    const i18n = createI18n({
      legacy: false,
      locale: configManager.getIfAvailable('LOCALE'),
      fallbackLocale: 'en_EN',
      messages: await localeMessages(),
    })
    app.use(i18n)
    app.use(router)
    app.mount('#app')
  })
