import type { ArchiveProduct } from '@/lib/products'
import {
  fetchLatestArchiveProduct,
  fetchProduct,
  postProduct,
} from '@/lib/products/requests'
import { IntervalItem } from '@/lib/TimeControl/interval'
import { DateTime } from 'luxon'

/**
 * Creates a new product from a template.
 *
 * @param piUrl - The base URL of the FEWS PI service.
 * @param name - The name of the product.
 * @param author - The author of the product.
 * @param archiveProduct - The archive product metadata.
 * @param template - The template to use for creating the product.
 * @param viewPeriod - The time interval to consider for fetching template metadata.
 * @throws Will log errors if required parameters are missing or fetching fails.
 */
export async function createNewProduct(
  piUrl: string,
  name: string,
  author: string,
  archiveProduct: ArchiveProduct | undefined,
  template: ArchiveProduct | undefined,
  viewPeriod: IntervalItem,
): Promise<void> {
  if (!template) {
    console.error('No template selected for new product')
    return
  }

  if (!archiveProduct) {
    console.error('No archive product provided for new product')
    return
  }

  if (!archiveProduct.areaId) {
    console.error('No areaId in archive product for new product')
    return
  }

  if (!archiveProduct.sourceId) {
    console.error('No sourceId in archive product for new product')
    return
  }

  const templateMetaData = await fetchLatestArchiveProduct(
    piUrl,
    template,
    viewPeriod,
  )

  if (!templateMetaData) {
    console.error('No template metadata found for new product')
    return
  }

  const htmlContent = await fetchProduct(piUrl, templateMetaData)

  const productId = archiveProduct.id

  const archiveProductAttributes: Record<string, string> = {}
  archiveProduct.attributes?.forEach((attr) => {
    if (attr.key && attr.value) {
      archiveProductAttributes[attr.key] = attr.value
    }
  })

  const attributesForProvidedValues = {
    ...(author && { author }),
    ...(name && { name }),
    ...(productId && { productId }),
  }

  const attributes = {
    ...attributesForProvidedValues,
    ...archiveProductAttributes,
  }

  const fileName =
    templateMetaData.relativePathProducts[0].split('/').pop() ?? 'unknown'

  const timeZero = DateTime.now().toUTC().startOf('second').toISO({
    suppressMilliseconds: true,
  })

  await postProduct(
    piUrl,
    archiveProduct.areaId,
    archiveProduct.sourceId,
    archiveProduct.timeZero ?? timeZero,
    htmlContent,
    fileName,
    attributes,
  )
}
