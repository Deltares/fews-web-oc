import '@/router/class-component-hooks'
import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'
import router from './router'
// import i18n from './i18n'
// import './plugins/vue2mapbox-gl'
import auth from '@/services/authentication'
import config, { configManager } from '@/services/application-config'
import { defineCustomElements } from '@deltares/fews-ssd-webcomponent/loader'
import PortalVue from 'portal-vue'

defineCustomElements(window)
// Optional: Provide an easy way to register the custom element.

Vue.config.ignoredElements = ['schematic-status-display']
Vue.use(PortalVue)

Vue.config.productionTip = false


fetch(`${import.meta.env.BASE_URL}app-config.json`)
  .then(res => res.json())
  .then(data => {
    Vue.use(config, data)
    if (configManager.authenticationIsEnabled) {
      Vue.use(auth, configManager.getUserManagerSettings())
    }
    const app = new Vue({
      store,
      vuetify,
      router,
      // i18n,
      render: h => h(App)
    })
    // Vue.use(i18n); // you must install `i18n` instance which is created by `createI18n`
    app.$mount('#app')
  })
