import '@/router/class-component-hooks'
import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'
import router from './router'
import './plugins/vue2mapbox-gl'
import auth from '@/services/auth'
import config from '@/services/application-config'
import { defineCustomElements } from 'fews-ssd-web-component'
import PortalVue from 'portal-vue'
import 'wb-charts/dist/wb-charts-light.css'

defineCustomElements(window)
// Optional: Provide an easy way to register the custom element.

Vue.config.ignoredElements = ['schematic-status-display']
Vue.use(PortalVue)
Vue.use(auth)

Vue.config.productionTip = false

fetch(`${process.env.BASE_URL}app-config.json`)
  .then(res => res.json())
  .then(data => {
    Vue.use(config, data)

    new Vue({
      store,
      vuetify,
      router,
      render: h => h(App)
    }).$mount('#app')
  })
