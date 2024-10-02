import type { VDataTable } from 'vuetify/components'

type ReadonlyDataTableHeader = (typeof VDataTable)['headers']

export interface TableHeaders extends ReadonlyDataTableHeader {
  color?: string
  editable: boolean
}
