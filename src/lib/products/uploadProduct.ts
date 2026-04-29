import { postFileProduct } from '@/lib/products/requests'
import { hashObject } from '@/services/useProducts'
import { DateTime } from 'luxon'

/**
 * Uploads a product file to the archive.
 *
 * @param piUrl - The base URL of the FEWS PI service.
 * @param name - The name of the product.
 * @param author - The author of the product.
 * @param areaId - The identifier for the area.
 * @param sourceId - The identifier for the source.
 * @param file - The file to upload.
 * @throws Will log errors if required parameters are missing.
 */
export async function uploadProduct(
  piUrl: string,
  name: string,
  author: string,
  areaId: string | undefined,
  sourceId: string | undefined,
  file: File | undefined,
): Promise<void> {
  if (!file) {
    console.error('No file selected for upload')
    return
  }

  if (!areaId) {
    console.error('No areaId provided for upload')
    return
  }

  if (!sourceId) {
    console.error('No sourceId provided for upload')
    return
  }

  const formInput = {
    name,
    author,
  }
  const productId = await hashObject(formInput)
  const attributes = {
    ...formInput,
    productId,
  }

  const timeZero = DateTime.now().toUTC().startOf('second').toISO({
    suppressMilliseconds: true,
  })

  await postFileProduct(piUrl, areaId, sourceId, timeZero, file, attributes)
}
