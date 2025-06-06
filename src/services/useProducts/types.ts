import { type ArchiveProductsMetadataEntry } from '@deltares/fews-pi-requests'

export type ProductMetaDataWithoutAttributes = Omit<
  ArchiveProductsMetadataEntry,
  'attributes'
>

export type ProductMetaDataType = Required<ProductMetaDataWithoutAttributes> & {
  key: string
  attributes: Record<string, string>
}
