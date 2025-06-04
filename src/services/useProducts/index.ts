import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  ArchiveProductsMetadataAttribute,
  ArchiveProductsMetadataEntry,
  PiArchiveWebserviceProvider,
  type ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'
import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { ProductMetaDataType, ProductMetaDataWithoutAttributes } from './types'

const daysBack = 100 // Number of days to look back for product metadata

/**
 * Hook to fetch and manage product metadata based on a given filter.
 *
 * @param filter - A reactive reference or getter function for the product metadata filter.
 * @returns An object containing a reactive reference to the list of product metadata.
 */
export function useProducts(filter: MaybeRefOrGetter<ProductsMetaDataFilter>) {
  const products = ref<ProductMetaDataType[]>([])
  const error = ref<string | null>(null)

  const provider = new PiArchiveWebserviceProvider(
    import.meta.env.VITE_APP_FEWS_PI_URL,
    { transformRequestFn: createTransformRequestFn() },
  )

  const fetchProducts = async () => {
    const filterValue = toValue(filter)
    const now = new Date()
    const startForecastTime = new Date(
      now.getTime() - daysBack * 24 * 60 * 60 * 1000,
    ).toISOString()
    const endForecastTime = now.toISOString()

    const productFilter: ProductsMetaDataFilter = {
      startForecastTime,
      endForecastTime,
      ...filterValue,
    }
    try {
      const response = await provider.getProductsMetaData(productFilter)
      const itemPromises = response.productsMetadata
        .filter((p) => p.sourceId === 'demo')
        .map(convertToProductMetaDataType)
      products.value = await Promise.all(itemPromises)
    } catch (err) {
      error.value = 'Error fetching product metadata'
      console.error(err)
    }
  }

  const getProductByKey = (key: string) => {
    return products.value.find((product) => product.key === key)
  }

  watchEffect(async () => {
    fetchProducts()
  })

  return {
    products,
    fetchProducts,
    getProductByKey,
    error,
  }
}

/**
 * Excludes specified properties from an object and returns a new object.
 *
 * @typeParam T - The type of the input object.
 * @param obj - The object to exclude properties from.
 * @param excludeProperties - An array of property keys to exclude.
 * @returns A new object without the excluded properties.
 */
function excludeProps<T extends ArchiveProductsMetadataEntry>(
  obj: T,
  excludeProperties: (keyof T)[],
): ProductMetaDataWithoutAttributes {
  return Object.keys(obj).reduce((acc, key) => {
    if (!excludeProperties.includes(key as keyof T)) {
      // @ts-ignore: TypeScript doesn't know that key is a valid key of T
      acc[key] = obj[key]
    }
    return acc
  }, {} as ProductMetaDataWithoutAttributes)
}

/**
 * Converts an array of metadata attributes into a key-value object.
 *
 * @param attrs - An array of metadata attributes.
 * @returns A record where keys are attribute keys and values are attribute values.
 */
const attributesToObject = (
  attrs: ArchiveProductsMetadataAttribute[],
): Record<string, string> => {
  return attrs.reduce(
    (acc, attr) => {
      acc[attr.key] = attr.value
      return acc
    },
    {} as Record<string, any>,
  )
}

/**
 * Converts an `ArchiveProductsMetadataEntry` into a `ProductMetaDataType`.
 *
 * @param entry - The metadata entry to convert.
 * @returns A promise that resolves to the converted product metadata type.
 */
export async function convertToProductMetaDataType(
  entry: ArchiveProductsMetadataEntry,
): Promise<ProductMetaDataType> {
  const attributes: Record<string, string> = attributesToObject(
    entry.attributes,
  )
  const key = await keyForProductMetaDataType(entry)
  const copy = excludeProps(entry, ['attributes'])
  // @ts-ignore
  return { key, ...copy, attributes }
}

/**
 * Generates a unique key for a product metadata entry by hashing its properties.
 *
 * @param entry - The metadata entry to generate a key for.
 * @returns A promise that resolves to the unique key as a string.
 */
export function keyForProductMetaDataType(entry: ArchiveProductsMetadataEntry) {
  const hash = hashObject(
    excludeProps(entry, ['relativePathMetaDataFile', 'relativePathProducts']),
  )
  return hash
}

/**
 * Computes a SHA-256 hash for a given object.
 *
 * @param obj - The object to hash.
 * @returns A promise that resolves to the hash as a hexadecimal string.
 */
async function hashObject(obj: any): Promise<string> {
  const json = JSON.stringify(sortObjectKeys(obj))

  const encoder = new TextEncoder()
  const data = encoder.encode(json)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  const hexString = bufferToHex(hashBuffer)
  console.log('HashBuffer:', hexString)

  return hexString
}

/**
 * Recursively sorts the keys of an object to ensure consistent ordering.
 *
 * @param obj - The object to sort.
 * @returns A new object with sorted keys.
 */
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = sortObjectKeys(obj[key])
        return result
      }, {})
  }
  return obj
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The hexadecimal string representation of the buffer.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
