import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  ArchiveProductsMetadataAttribute,
  ArchiveProductsMetadataEntry,
  PiArchiveWebserviceProvider,
  type ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'
import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { ProductMetaDataType, ProductMetaDataWithoutAttributes } from './types'
import {
  ArchiveProduct,
  ArchiveProductSet,
} from '@/lib/products/documentDisplay'

/**
 * Hook to fetch and manage product metadata based on a given filter.
 *
 * @param filter - A reactive reference or getter function for the product metadata filter.
 * @returns An object containing a reactive reference to the list of product metadata.
 */
export function useProducts(
  baseUrl: string,
  filter: MaybeRefOrGetter<ProductsMetaDataFilter>,
  sourceId: MaybeRefOrGetter = ref('weboc'),
  areaId: MaybeRefOrGetter = ref('products'),
  archiveProductSets: MaybeRefOrGetter<ArchiveProductSet[]> = ref([]),
  archiveProducts: MaybeRefOrGetter<ArchiveProduct[]> = ref([]),
) {
  const products = ref<ProductMetaDataType[]>([])
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const mostRecentTemplate = ref<ProductMetaDataType | null>(null)

  const refresh = () => {
    error.value = null
    fetchProducts()
  }

  const fetchProducts = async () => {
    products.value = [] // Reset products before fetching new ones
    for (const product of toValue(archiveProducts)) {
      const filterValue = toValue(filter)
      // Ensure the filter has a valid date range
      if (!filterValue.startForecastTime || !filterValue.endForecastTime) {
        return
      }
      // FIXME: Configure correct versionKey
      // filterValue.versionKey = product.versionKeys
      // Set all attributes from the product
      filterValue.attribute = product.attributes.reduce(
        (
          acc: Record<string, string>,
          attr: ArchiveProductsMetadataAttribute,
        ) => {
          acc[attr.key] = attr.value
          return acc
        },
        {} as Record<string, string>,
      )
      if (product.id) {
        filterValue.attribute['productId'] = product.id
      }
      try {
        const response = await fetchProductsMetaData(baseUrl, filterValue)
        const filteredProducts = response.filter((p) => {
          return (
            p.sourceId === toValue(sourceId) && p.areaId === toValue(areaId)
          )
        })
        products.value.push(...filteredProducts)
        lastUpdated.value = new Date()
        if (product.id) {
          // If the product has an ID, we check for templates
          filterValue.attribute['productId'] = 'template_' + product.id
          const response = await fetchProductsMetaData(baseUrl, filterValue)
          if (response.length > 0) {
            // If we find a template, we set it as the most recent template
            mostRecentTemplate.value = response[response.length - 1]
          } else {
            mostRecentTemplate.value = null
          }
        }
      } catch (err) {
        error.value = 'Error fetching product metadata'
        console.error(err)
      }
    }
    if (toValue(archiveProducts).length > 0) return

    // if we have product sets, we need to fetch for each set
    const constraints = toValue(archiveProductSets).map(
      (set) => set.constraints,
    )
    // if we get no explicit constraints, we use the default filter
    if (constraints.length === 0) {
      constraints.push({ areaId: toValue(areaId), sourceId: toValue(sourceId) })
    }
    for (const constraint of constraints) {
      const filterValue = toValue(filter)
      // Ensure the filter has a valid date range
      if (!filterValue.startForecastTime || !filterValue.endForecastTime) {
        return
      }
      const allValid = toValue(constraint)?.allValid
      if (allValid) {
        filterValue.attribute = allValid.reduce(
          (acc: Record<string, string>, constraint) => {
            acc[constraint.attributeTextEquals.id] =
              constraint.attributeTextEquals.equals
            return acc
          },
          {} as Record<string, string>,
        )
      }
      const anyValid = toValue(constraint)?.anyValid
      try {
        const response = await fetchProductsMetaData(baseUrl, filterValue)
        const filteredProducts = response.filter((p) => {
          if (anyValid) {
            return (
              anyValid.some(
                (constraint) =>
                  p.attributes[constraint.attributeTextEquals.id] ===
                  constraint.attributeTextEquals.equals,
              ) &&
              p.sourceId === toValue(sourceId) &&
              p.areaId === toValue(areaId)
            )
          }
          return (
            p.sourceId === toValue(sourceId) && p.areaId === toValue(areaId)
          )
        })
        products.value = filteredProducts
        lastUpdated.value = new Date()
      } catch (err) {
        error.value = 'Error fetching product metadata'
        console.error(err)
      }
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
    refresh,
    lastUpdated,
    error,
    mostRecentTemplate,
  }
}

/**
 * Fetch product metadata based on a given filter.
 *
 * @param baseUrl - The base URL for the product metadata API.
 * @param filter - The product metadata filter.
 * @returns A promise resolving to the list of product metadata.
 */
export async function fetchProductsMetaData(
  baseUrl: string,
  filter: ProductsMetaDataFilter,
): Promise<ProductMetaDataType[]> {
  const provider = new PiArchiveWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  try {
    const response = await provider.getProductsMetaData(filter)
    const itemPromises = response.productsMetadata.map(
      convertToProductMetaDataType,
    )
    return await Promise.all(itemPromises)
  } catch (err) {
    console.error(err)
    throw new Error('Error fetching product metadata')
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
export function attributesToObject(
  attrs: ArchiveProductsMetadataAttribute[],
): Record<string, string> {
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
export async function hashObject(obj: any): Promise<string> {
  const json = JSON.stringify(sortObjectKeys(obj))

  const encoder = new TextEncoder()
  const data = encoder.encode(json)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  const hexString = bufferToHex(hashBuffer)
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
