import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { defineCustomElements } from '@deltares/fews-ssd-webcomponent/loader'
import 'maplibre-gl/dist/maplibre-gl.css'
import './assets/maplibre-override.css'

import { runAppBootstrap } from './lib/startup/app-startup.js'
import { applyPlatformClasses } from './services/usePlatform/index.js'

// Before the first render, so styles gated on the client never flash the wrong
// variant. The same bundle serves browsers and the Capacitor app, so this is what
// lets a stylesheet target the app alone.
applyPlatformClasses()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

defineCustomElements(globalThis.window)
app.config.compilerOptions.isCustomElement = (tag) =>
  tag === 'schematic-status-display'

app.use(pinia)
app.use(vuetify)

await runAppBootstrap(app)
