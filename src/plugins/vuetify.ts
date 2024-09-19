// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as directives from 'vuetify/directives'
import * as components from 'vuetify/components'
// import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
// import { i18n } from './i18n'
// import { useI18n } from 'vue-i18n'
import { VTimePicker } from 'vuetify/labs/VTimePicker'

import LuxonAdapter from '@date-io/luxon'

const vuetify = createVuetify({
  components: {
    ...components,
    VTimePicker,
  },
  directives,
  date: {
    adapter: LuxonAdapter,
  },
  // locale: {
  //   adapter: createVueI18nAdapter({ i18n, useI18n }),
  // },
})

export default vuetify
