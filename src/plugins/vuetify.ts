// Vuetify
import '@/styles/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { i18n } from './i18n'
import { useI18n } from 'vue-i18n'
import { RESOURCE_ICON_SET } from '@/lib/icons'
import ResourceIcon from '@/components/general/ResourceIcon.vue'

const vuetify = createVuetify({
  icons: {
    sets: {
      [RESOURCE_ICON_SET]: { component: ResourceIcon },
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  defaults: {
    VBtn: {
      variant: 'text',
    },
  },
})

export default vuetify
