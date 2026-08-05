import { convertToProductMetaDataType } from '@/services/useProducts'
import { type ProductMetaDataType } from '@/services/useProducts/types'
import { type ProductsMetaDataFilter } from '@deltares/fews-pi-requests'
import { type PostResponse } from '@/lib/products/types'

const LOCAL_PRODUCTS_METADATA_STORAGE_KEY = 'weboc-products-metadata-v1.0.0'

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

    if (existingIndex !== -1) {
      combined[existingIndex] = localProduct

      if (isSameProductMetaData(localProduct, combined[existingIndex])) {
        toRemove.push(localProduct.relativePathMetaDataFile)
      }
    } else {
      combined.push(localProduct)
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
  productA: ProductMetaDataType,
  productB: ProductMetaDataType,
) {
  if (productA.relativePathMetaDataFile !== productB.relativePathMetaDataFile) {
    return false
  }

  if (productA.timeZero !== productB.timeZero) {
    return false
  }

  if (productA.version !== productB.version) {
    return false
  }

  for (const attribute of Object.keys(productA.attributes)) {
    if (productA.attributes[attribute] !== productB.attributes[attribute]) {
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

export async function storeLocalProductsMetaData(product: PostResponse) {
  const stored = readLocalProductsMetaData()
  const metaData = await convertToProductMetaDataType(product)
  const remaining = stored.filter(
    (item) =>
      item.relativePathMetaDataFile !== metaData.relativePathMetaDataFile,
  )
  writeLocalProductsMetaData([...remaining, metaData])
}

export function storeUpdatedLocalAttributes(
  relativePathMetaDataFile: string,
  attributes: Record<string, string>,
) {
  const stored = readLocalProductsMetaData()
  const updated = stored.map((item) =>
    item.relativePathMetaDataFile === relativePathMetaDataFile
      ? {
          ...item,
          attributes: {
            ...item.attributes,
            ...attributes,
          },
        }
      : item,
  )
  writeLocalProductsMetaData(updated)
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
