// Vuetify
import { toHumanReadableDate } from '@/lib/date'
import '@/styles/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
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
