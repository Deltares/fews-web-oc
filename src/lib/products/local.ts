import { convertToProductMetaDataType } from '@/services/useProducts'
import { type ProductMetaDataType } from '@/services/useProducts/types'
import { type ProductsMetaDataFilter } from '@deltares/fews-pi-requests'
import { type PostResponse } from '@/lib/products/types'

const LOCAL_PRODUCTS_METADATA_STORAGE_KEY = 'weboc-products-metadata-v1.0.0'
export const FEWS_PRODUCT_ATTRIBUTE_LOCAL = 'fews:local'

export function combineProductsMetaData(
  remoteProducts: ProductMetaDataType[],
  localProducts: ProductMetaDataType[],
): ProductMetaDataType[] {
  const combined = [...remoteProducts]

  const toRemove = []

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

    if (isSameProductMetaData(combined[existingIndex], localProduct)) {
      toRemove.push(localProduct.relativePathMetaDataFile)
    } else {
      combined[existingIndex] = localProduct
    }
  }

  removeLocalProductsMetaData(toRemove)

  return combined
}

export function getLocalProductsMetaData(filter: ProductsMetaDataFilter) {
  const stored = readLocalProductsMetaData()
  return stored.filter((product) =>
    matchesProductsMetaDataFilter(product, filter),
  )
}

function isSameProductMetaData(
  remote: ProductMetaDataType,
  local: ProductMetaDataType,
) {
  if (remote.relativePathMetaDataFile !== local.relativePathMetaDataFile) {
    return false
  }

  if (remote.timeZero !== local.timeZero) {
    return false
  }

  for (const attribute of Object.keys(remote.attributes)) {
    if (remote.attributes[attribute] !== local.attributes[attribute]) {
      return false
    }
  }

  return true
}

function removeLocalProductsMetaData(relativePathMetaDataFiles: string[]) {
  if (!relativePathMetaDataFiles.length) return
  const stored = readLocalProductsMetaData()
  const remaining = stored.filter(
    (item) =>
      !relativePathMetaDataFiles.includes(item.relativePathMetaDataFile),
  )
  writeLocalProductsMetaData(remaining)
}

export async function storeLocalProductsMetaData(
  product: PostResponse,
  content?: string,
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
    // Set to get the same hashed key and keep selection
    // @ts-ignore: PostResponse gives a string but ProductMetaDataType expects a number
    version,
  })
  metaData.attributes[FEWS_PRODUCT_ATTRIBUTE_LOCAL] = 'true'
  metaData.relativePathProducts = [
    product.relativePathProducts[0],
    // FIXME: hack
    content ?? '',
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
