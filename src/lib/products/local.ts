import { convertToProductMetaDataType } from '@/services/useProducts'
import { type ProductMetaDataType } from '@/services/useProducts/types'
import {
  type ArchiveProductsMetadataEntry,
  type ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'
import { type PostResponse } from '@/lib/products/types'

const LOCAL_PRODUCTS_METADATA_STORAGE_KEY = 'weboc-products-metadata-v1.0.0'
export const FEWS_PRODUCT_ATTRIBUTE_LOCAL = 'fews:local'

export function combineProductsMetaData(
  remoteProducts: ProductMetaDataType[],
  localProducts: ProductMetaDataType[],
): ProductMetaDataType[] {
  const combined = [...remoteProducts]

  for (const localProduct of localProducts) {
    const existingIndex = combined.findIndex(
      (product) =>
        product.relativePathMetaDataFile ===
        localProduct.relativePathMetaDataFile,
    )

    if (existingIndex === -1) {
      combined.push(localProduct)
      continue
    }

    combined[existingIndex] = localProduct
  }

  return combined
}

export function removeRemoteFromLocalProductsMetaData(
  remoteProducts: ArchiveProductsMetadataEntry[],
) {
  const stored = readLocalProductsMetaData()
  const remaining = stored.filter(
    (localProduct) =>
      !remoteProducts.some((remoteProduct) =>
        isSameProductMetaData(remoteProduct, localProduct),
      ),
  )

  writeLocalProductsMetaData(remaining)
}

export function getLocalProductsMetaData(filter: ProductsMetaDataFilter) {
  const stored = readLocalProductsMetaData()
  return stored.filter((product) =>
    matchesProductsMetaDataFilter(product, filter),
  )
}

function isSameProductMetaData(
  remote: ArchiveProductsMetadataEntry,
  local: ProductMetaDataType,
) {
  if (remote.relativePathMetaDataFile !== local.relativePathMetaDataFile) {
    return false
  }

  if (remote.timeZero !== local.timeZero) {
    return false
  }

  for (const attribute of remote.attributes) {
    if (attribute.value !== local.attributes[attribute.key]) {
      return false
    }
  }

  return true
}

export async function storeLocalProductsMetaData(
  product: PostResponse,
  options?: {
    content?: string
    file?: File
  },
) {
  const stored = readLocalProductsMetaData()

  // NOTE: Only version keys on productId
  const version =
    stored.filter(
      (item) =>
        item.attributes['productId'] ===
        product.attributes.find((attr) => attr.key === 'productId')?.value,
    ).length + 1

  const metaData = await convertToProductMetaDataType({
    ...product,
    // Add 999 to the version to ensure that local products are always considered newer than remote products with the same version
    version: String(version + 999),
  })
  metaData.attributes[FEWS_PRODUCT_ATTRIBUTE_LOCAL] = 'true'
  metaData.relativePathProducts = [
    product.relativePathProducts[0],
    options?.content ?? '',
    options?.file ? URL.createObjectURL(options.file) : '',
  ]

  const remaining = stored.filter(
    (item) =>
      item.relativePathMetaDataFile !== metaData.relativePathMetaDataFile,
  )
  writeLocalProductsMetaData([metaData, ...remaining])
}

export function isLocalProduct(product: ProductMetaDataType | undefined) {
  return product?.attributes[FEWS_PRODUCT_ATTRIBUTE_LOCAL] === 'true'
}

export function updateLocalProductsMetaDataAttributes(
  relativePathMetaDataFile: string,
  attributes: Record<string, string>,
) {
  const stored = readLocalProductsMetaData()
  const item = stored.find(
    (item) => item.relativePathMetaDataFile === relativePathMetaDataFile,
  )
  if (!item) return

  item.attributes = {
    ...item.attributes,
    ...attributes,
  }

  writeLocalProductsMetaData(stored)
}

function matchesProductsMetaDataFilter(
  product: ProductMetaDataType,
  filter: ProductsMetaDataFilter,
) {
  if (filter.attribute) {
    for (const [key, value] of Object.entries(filter.attribute)) {
      if (product.attributes[key] !== String(value)) {
        return false
      }
    }
  }
  if (filter.startForecastTime && product.timeZero < filter.startForecastTime) {
    return false
  }
  if (filter.endForecastTime && product.timeZero > filter.endForecastTime) {
    return false
  }
  return true
}

function readLocalProductsMetaData(): ProductMetaDataType[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(LOCAL_PRODUCTS_METADATA_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ProductMetaDataType[]
  } catch {
    return []
  }
}

function writeLocalProductsMetaData(products: ProductMetaDataType[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    LOCAL_PRODUCTS_METADATA_STORAGE_KEY,
    JSON.stringify(products),
  )
}
