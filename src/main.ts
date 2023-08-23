import { createApp } from 'vue'
import App from './App.vue'
import auth from './services/authentication'
import config, { configManager } from './services/application-config'
import router from './router/index.js'
import vuetify from './plugins/vuetify.js'

const app = createApp(App)

fetch(`${import.meta.env.BASE_URL}app-config.json`)
  .then((res) => res.json())
  .then((data) => {
    app.use(config, data)
    if (configManager.authenticationIsEnabled) {
      app.use(auth, configManager.getUserManagerSettings())
    }
    app.use(router)
    app.use(vuetify)
    app.mount('#app')
  })
