// Vuetify
import { toHumanReadableDate } from '@/lib/date'
import '@/styles/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  theme: {
    cspNonce: ( document?.querySelector('meta[property="csp-nonce"]') as HTMLMetaElement).nonce || 'nonce meta element not present'
  },
  defaults: {
    VBtn: {
      variant: 'text',
    },
    VDateInput: {
      displayFormat: toHumanReadableDate,
      placeholder: 'dd/mm/yyyy',
    },
  },
})

export default vuetify
