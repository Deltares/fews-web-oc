import { ProductMetaDataType } from '@/services/useProducts/types.js'
import { createTransformRequestFn } from '../requests/transformRequest.js'
import type { PostResponse } from './types.js'
import { PiArchiveWebserviceProvider } from '@deltares/fews-pi-requests'

/**
 * Determines if a given string contains HTML content.
 *
 * @param str - The string to check for HTML content.
 * @returns `true` if the string contains HTML elements, otherwise `false`.
 */
function isHTML(str: string) {
  const doc = new DOMParser().parseFromString(str, 'text/html')
  return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1)
}

/**
 * Detects the MIME content type of the provided content based on its binary header or HTML structure.
 *
 * @param content - The content to analyze, typically a binary buffer or string.
 * @returns The detected MIME type as a string (e.g., 'image/png', 'html', or 'unknown').
 */
export function getContentType(content: any): string {
  const arr = new Uint8Array(content).subarray(0, 4)
  let header = ''
  let type = ''
  for (const part of arr) {
    header += part.toString(16)
  }
  switch (header) {
    case '89504e47':
      type = 'image/png'
      break
    case '47494638':
      type = 'image/gif'
      break
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2':
    case 'ffd8ffe3':
    case 'ffd8ffe8':
      type = 'image/jpeg'
      break
    default:
      if (isHTML(content)) {
        type = 'text/html'
      } else {
        type = 'unknown' // Or you can use the blob.type as fallback
      }
  }
  return type
}

/**
 * Maps a MIME content type to a corresponding file extension.
 *
 * @param contentType - The MIME type string (e.g., 'image/png').
 * @returns The file extension as a string (e.g., 'png', 'html', or 'txt').
 */
export function getContentExtension(contentType: string): string {
  switch (contentType.split(';')[0]) {
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/jpeg':
      return 'jpeg'
    case 'image/svg+xml':
      return 'svg'
    case 'text/html':
      return 'html'
    default:
      return 'txt'
  }
}

/**
 * Sends a product to the specified archive URL using a POST request.
 *
 * @param archiveUrl - The base URL of the archive endpoint.
 * @param areaId - The identifier for the area.
 * @param productId - The identifier for the product.
 * @param timeZero - The reference time for the product.
 * @param product - The product content to be sent (string, number, or boolean).
 * @param attributes - Additional attributes to include in the request as key-value pairs.
 * @returns A promise that resolves to the metadata of the posted product.
 * @throws Will throw an error if the request fails or the response is not OK.
 */
export async function postProduct(
  archiveUrl: string,
  areaId: string,
  sourceId: string,
  timeZero: string,
  content: string | number | boolean,
  filename: string,
  attributes: Record<string, string | boolean>,
): Promise<PostResponse> {
  let url = `${archiveUrl}products?areaId=${areaId}&sourceId=${sourceId}&timeZero=${timeZero}&fileName=${filename}`

  for (const key in attributes) {
    url = `${url}&attribute(${key})=${attributes[key]}`
  }

  const encodedKey = encodeURIComponent('productContent')
  const encodedValue = encodeURIComponent(content)
  const formBody = encodedKey + '=' + encodedValue

  const transformRequest = createTransformRequestFn()
  const request = await transformRequest(
    new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    }),
  )
  const response = await fetch(request)

  if (!response.ok) {
    const msg = await response.text()
    throw new Error(msg || 'Failed to send request.')
  }

  const responseData = await response.json()
  return responseData.productsMetadata[0]
}

/**
 * Sends a file as product to the specified archive URL using a POST request.
 *
 * @param archiveUrl - The base URL of the archive endpoint.
 * @param areaId - The identifier for the area.
 * @param productId - The identifier for the product.
 * @param timeZero - The reference time for the product.
 * @param file - The product content to be sent.
 * @param attributes - Additional attributes to include in the request as key-value pairs.
 * @returns A promise that resolves to the metadata of the posted product.
 * @throws Will throw an error if the request fails or the response is not OK.
 */
export async function postFileProduct(
  archiveUrl: string,
  areaId: string,
  sourceId: string,
  timeZero: string,
  file: File,
  attributes: Record<string, string | boolean>,
): Promise<PostResponse> {
  let url = `${archiveUrl}products?areaId=${areaId}&sourceId=${sourceId}&timeZero=${timeZero}`

  for (const key in attributes) {
    url = `${url}&attribute(${key})=${attributes[key]}`
  }
  const transformRequest = createTransformRequestFn()
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
  const fileName = file.name.substring(0, file.name.lastIndexOf('.'))
  const newFileName = `${fileName}.${fileExtension}`

  const renamedFile = new File([file], newFileName, { type: file.type })

  const formData = new FormData()
  formData.append('file', renamedFile)
  const request = await transformRequest(
    new Request(url, {
      method: 'POST',
      body: formData,
    }),
  )
  const response = await fetch(request)

  if (!response.ok) {
    const msg = await response.text()
    throw new Error(msg || 'Failed to send request.')
  }

  const responseData = await response.json()
  return responseData.productsMetadata[0]
}

export async function deleteProduct(
  baseUrl: string,
  product: ProductMetaDataType,
): Promise<void> {
  const provider = new PiArchiveWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })
  await provider.postProductAttributes({ relativePath: product.relativePathMetaDataFile, attribute: { 'fews:delete': 'true' } })
}
