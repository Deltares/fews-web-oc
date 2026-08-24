// Import styles, initialize component theme here.
// import '../src/common.css';
import { beforeMount } from '@playwright/experimental-ct-vue/hooks'
import vuetify from '../src/plugins/vuetify.js'

beforeMount(async ({ app }) => {
  app.use(vuetify)
})
