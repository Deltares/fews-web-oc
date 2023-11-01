// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as directives from 'vuetify/directives'
import * as components from 'vuetify/components'
import { VDataTable } from 'vuetify/labs/VDataTable'
import { VDatePicker } from 'vuetify/labs/VDatePicker'

const vuetify = createVuetify({
  components: {
    ...components,
    VDataTable,
    VDatePicker,
  },
  directives,
})

export default vuetify
