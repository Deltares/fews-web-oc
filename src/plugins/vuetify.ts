import Vue from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import Vuetify from 'vuetify/lib/framework'
import en from 'vuetify/src/locale/en'
import nl from 'vuetify/src/locale/nl'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  lang: {
    locales: { en, nl },
    current: import.meta.env.VITE_APP_I18N_LOCALE ?? 'nl',
  },
  breakpoint: {
    mobileBreakpoint: 'sm'
  },
})
