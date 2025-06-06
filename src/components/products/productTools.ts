import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { ProductMetaDataType } from '@/services/useProducts/types'
import { convertToProductMetaDataType } from '@/services/useProducts/'
import {
  PiArchiveWebserviceProvider,
  ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'

/**
 * Retrieves the latest products from a list of product metadata.
 *
 * @param products - An array of product metadata of type `ProductMetaDataType`.
 * @returns An array of unique and latest product metadata.
 *
 * @remarks
 * - The function sorts the products by version and time zero in descending order.
 * - It ensures that only unique products are returned based on their `productId` attribute.
 */
function getLatestProducts(products: ProductMetaDataType[]) {
  products.sort((a, b) => {
    return +b.version - +a.version
  })

  products.sort((a, b) => {
    return new Date(b.timeZero).getTime() - new Date(a.timeZero).getTime()
  })

  return getUniqueProducts(products)
}

/**
 * Filters a list of products to return only unique products based on their `productId` attribute.
 *
 * @param products - An array of product metadata of type `ProductMetaDataType`.
 * @returns An array of unique product metadata.
 *
 * @remarks
 * - The function uses a `Map` to track unique products by their `productId`.
 * - If multiple products have the same `productId`, only the first occurrence is retained.
 */
function getUniqueProducts(products: ProductMetaDataType[]) {
  const productMap: Map<string, ProductMetaDataType> = new Map()
  for (const product of products) {
    let entry = productMap.get(product.attributes.productId)
    if (entry === undefined) {
      productMap.set(product.attributes.productId, product)
      entry = product
    }
  }
  return Array.from(productMap.values())
}

/**
 * Retrieves the latest product metadata for a given area and product ID.
 *
 * @param areaId - The ID of the area for which to retrieve product metadata.
 * @param productId - The ID of the product for which to retrieve metadata.
 * @returns A promise that resolves to the latest product metadata of type `ProductMetaDataType`.
 *
 * @remarks
 * - The function fetches product metadata from the PiArchiveWebserviceProvider using the provided area and product IDs.
 * - It filters the metadata based on forecast time and version keys.
 * - The metadata is sorted by version and time zero to determine the latest product.
 * - If no products are found, the function may return `undefined`.
 */
export async function getLastProductsMetaData(
  areaId: string,
  productId: string,
): Promise<ProductMetaDataType> {
  const startForecastTime = '1970-01-01T00:00:00Z'
  const endForecastTime = new Date().toISOString()
  const provider = new PiArchiveWebserviceProvider(
    import.meta.env.VITE_APP_FEWS_PI_URL,
    { transformRequestFn: createTransformRequestFn() },
  )

  const filter: ProductsMetaDataFilter = {
    startForecastTime,
    endForecastTime,
    versionKey: ['product_id', 'area_id'],
  }

  filter['attribute'] = {
    area_id: areaId,
    product_id: productId,
  }

  const response = await provider.getProductsMetaData(filter)
  const products = response.productsMetadata.map(convertToProductMetaDataType)
  const latestProducts = getLatestProducts(products as any)
  return latestProducts[0]
}

/**
 * Generates a URL to access a product based on its metadata.
 *
 * @param metaData - The metadata of the product for which to generate the URL.
 * @returns A string representing the URL to access the product. If no metadata is provided, returns `'invalid'`.
 *
 * @remarks
 * - The URL is constructed using the `relativePathProducts` property of the metadata and the base URL from environment variables.
 * - Ensure that the `metaData` parameter is valid and contains the required `relativePathProducts` property.
 */
export function getProductURL(metaData?: ProductMetaDataType): string {
  if (metaData) {
    const relativePath = metaData.relativePathProducts[0]
    return `${import.meta.env.VITE_APP_FEWS_PI_URL}/rest/fewspiservice/v1/archive/products/id?relativePath=${relativePath}`
  }
  return 'invalid'
}
