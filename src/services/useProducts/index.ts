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
  Constraints,
} from '@/lib/products/documentDisplay'
import {
  IntervalItem,
  intervalToFewsPiDateRange,
} from '@/lib/TimeControl/interval'

export const FEWS_PRODUCT_ATTRIBUTE_DELETE = 'fews:delete'

/**
 * Hook to fetch and manage product metadata based on a given filter.
 *
 * @param filter - A reactive reference or getter function for the product metadata filter.
 * @returns An object containing a reactive reference to the list of product metadata.
 */
export function useProducts(
  baseUrl: string,
  viewPeriod: MaybeRefOrGetter<IntervalItem>,
  archiveProducts: MaybeRefOrGetter<
    ArchiveProductSet[] | ArchiveProduct[]
  > = ref([]),
) {
  const products = ref<ProductMetaDataType[]>([])
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  const refresh = async () => {
    error.value = null
    await fetchProducts()
    lastUpdated.value = new Date()
  }

  const fetchProducts = async () => {
    const period = toValue(viewPeriod)
    const [startForecastTime, endForecastTime] =
      intervalToFewsPiDateRange(period)

    if (!startForecastTime || !endForecastTime) {
      products.value = []
      return
    }

    const _archiveProducts = toValue(archiveProducts)

    if (isArchiveProductSet(_archiveProducts)) {
      products.value = await getArchiveProductSets(
        baseUrl,
        _archiveProducts,
        toValue(viewPeriod),
      )
    } else {
      products.value = await getArchiveProducts(
        baseUrl,
        _archiveProducts,
        toValue(viewPeriod),
      )
    }
  }

  const getProductByKey = (key: string) => {
    return products.value.find((product) => product.key === key)
  }

  watchEffect(async () => {
    await fetchProducts()
    lastUpdated.value = new Date()
  })

  return {
    products,
    fetchProducts,
    getProductByKey,
    refresh,
    lastUpdated,
    error,
  }
}

export async function getArchiveProducts(
  baseUrl: string,
  archiveProducts: ArchiveProduct[],
  viewPeriod: IntervalItem,
) {
  const period = toValue(viewPeriod)
  const [startForecastTime, endForecastTime] = intervalToFewsPiDateRange(period)

  if (!startForecastTime || !endForecastTime) {
    return []
  }

  const promises: Promise<ProductMetaDataType[]>[] = []
  for (const product of archiveProducts) {
    const filter = {} as ProductsMetaDataFilter
    filter.startForecastTime = startForecastTime
    filter.endForecastTime = endForecastTime
    filter.versionKey = product.versionKeys
      ? ['productId', ...product.versionKeys]
      : ['productId']
    // FIXME: Configure correct versionKey
    // filterValue.versionKey = product.versionKeys
    // Set all attributes from the product
    let attributes: Record<string, string> = {}

    product.attributes?.forEach((attr) => {
      if (attr.key && attr.value) {
        attributes[attr.key] = attr.value
      }
    })
    filter.attribute = attributes
    if (product.id) {
      filter.attribute['productId'] = product.id
    }

    promises.push(fetchProductsMetaData(baseUrl, filter))
  }

  const products = await Promise.all(promises)
  return products.flat()
}

async function getArchiveProductSets(
  baseUrl: string,
  archiveProductSets: ArchiveProductSet[],
  viewPeriod: IntervalItem,
) {
  const constraints = toValue(archiveProductSets).map((set) => set.constraints)
  return await getArchiveProductForConstraint(
    baseUrl,
    constraints[0],
    viewPeriod,
  )
}

async function getArchiveProductForConstraint(
  baseUrl: string,
  constraint: Constraints,
  viewPeriod: IntervalItem,
) {
  const [startForecastTime, endForecastTime] =
    intervalToFewsPiDateRange(viewPeriod)

  if (!startForecastTime || !endForecastTime) {
    return []
  }
  const filter = {} as ProductsMetaDataFilter
  filter.startForecastTime = startForecastTime
  filter.endForecastTime = endForecastTime

  const allValid = constraint?.allValid
  let attributes: Record<string, string> = {}
  if (allValid) {
    allValid.forEach((constraint) => {
      if (
        constraint.attributeTextEquals?.id &&
        constraint.attributeTextEquals?.equals
      ) {
        attributes = {
          ...attributes,
          [constraint.attributeTextEquals.id]:
            constraint.attributeTextEquals.equals,
        }
      }
    })
  }
  filter.attribute = attributes
  const response = await fetchProductsMetaData(baseUrl, filter)
  let filteredProducts = response.filter(
    (product) =>
      product.areaId === constraint.areaId &&
      product.sourceId === constraint.sourceId,
  )
  if (constraint.anyValid) {
    filteredProducts = filteredProducts.filter((product) => {
      return constraint.anyValid?.some((constraint) => {
        if (
          constraint.attributeTextEquals?.id &&
          constraint.attributeTextEquals?.equals
        ) {
          return (
            product.attributes[constraint.attributeTextEquals.id] ===
            constraint.attributeTextEquals.equals
          )
        }
        return false
      })
    })
  }
  return filteredProducts
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
    const promises = response.productsMetadata.map(convertToProductMetaDataType)
    const products = await Promise.all(promises)
    return products.filter(
      (product) => product.attributes[FEWS_PRODUCT_ATTRIBUTE_DELETE] !== 'true',
    )
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

function isArchiveProductSet(
  products: ArchiveProductSet[] | ArchiveProduct[],
): products is ArchiveProductSet[] {
  return (products as ArchiveProductSet[])[0]?.constraints !== undefined
}
