import type { VDataTable } from 'vuetify/components'

type ReadonlyHeaders = VDataTable['$props']['headers']
type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>> ? I : never
export type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<ReadonlyHeaders>

export interface TableHeaders extends ReadonlyDataTableHeader {
  color?: string
  editable: boolean
}
