import type { VDataTable } from 'vuetify/lib/labs/components.mjs'

type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
  ? UnwrapReadonlyArrayType<I>
  : A
type DT = InstanceType<typeof VDataTable>
type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> }
type DataTableHeader = DeepMutable<ReadonlyDataTableHeader>

export interface TableHeaders extends DataTableHeader {
  color?: string
}
