import { DocumentFormat } from '@deltares/fews-pi-requests'

export function filterToParams(filter: Record<string, any>): string {
  const filterArgs = Object.entries(filter).flatMap(([key, value]) => {
    if (value === undefined) return []

    const encodedValue = encodeURIComponent(value)
    return [`${key}=${encodedValue}`]
  })

  return filterArgs.length ? '?' + filterArgs.join('&') : ''
}

export function getExtension(documentFormat: DocumentFormat): string {
  switch (documentFormat) {
    case DocumentFormat.PI_JSON:
      return '.json'
    case DocumentFormat.PI_XML:
      return '.xml'
    case DocumentFormat.PI_CSV_ID_AND_NAME:
    case DocumentFormat.PI_CSV:
      return '.csv'
    case 'PI_NETCDF' as any:
      return '.nc'
    default:
      return ''
  }
}
export async function downloadFileAttachment(
  url: string,
  fileName: string,
  documentFormat: DocumentFormat,
  accessToken: string,
) {
  const headers = new Headers()
  if (accessToken) {
    const extension = getExtension(documentFormat)
    const downloadFileName = fileName + extension
    await downloadFileWithFetch(headers, url, downloadFileName, accessToken)
  }
  if (!accessToken || accessToken == '') downloadWithLink(url, fileName)
}

export async function downloadFileWithXhr(
  url: string | URL,
  fileName: string,
  accessToken: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.responseType = 'blob'
    req.open('GET', url)
    if (accessToken !== '') {
      req.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }

    req.onload = () => {
      if (req.status < 200 || req.status >= 300) {
        req.response.text().then((message: string) => {
          console.error(
            `Received error ${req.status} when downloading file from ${url}: ${message}`,
          )
          reject(new Error('Error downloading file.'))
        })
        return
      }

      const headerFileName = req
        .getResponseHeader('Content-Disposition')
        ?.split('filename=')[1]
        .split(';')[0]

      const downloadFileName = headerFileName ?? fileName
      clickDownloadBlob(req.response, downloadFileName)

      resolve()
    }

    req.onerror = () => {
      reject({
        status: req.status,
        statusText: req.statusText,
      })
    }

    req.send()
  })
}

async function downloadFileWithFetch(
  headers: Headers,
  url: string,
  fileName: string,
  accessToken: string,
) {
  headers.append('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  })
  if (response.ok) {
    const blob = await response.blob()
    clickDownloadBlob(blob, fileName)
  } else {
    const message = await response.text()
    throw new Error(message)
  }
}

function clickDownloadBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  clickDownloadUrl(blobUrl, fileName)
  window.URL.revokeObjectURL(blobUrl)
}

function downloadWithLink(url: string, fileName: string) {
  const encodedFileName = encodeURIComponent(fileName)
  url = `${url}&downloadAsFile=${encodedFileName}`
  clickDownloadUrl(url, fileName)
}

export function clickDownloadUrl(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', fileName)

  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadImageAsPng(
  image: HTMLImageElement,
  defaultFilename: string,
): Promise<void> {
  const blob = await convertImageToBlob(image)
  clickDownloadBlob(blob, defaultFilename)
}

async function convertImageToBlob(image: HTMLImageElement): Promise<Blob> {
  const canvas = new OffscreenCanvas(image.width, image.height)

  const context = canvas.getContext('2d')
  if (!context)
    throw new Error('Could not create 2D context for offscreen canvas')

  context.fillStyle = 'white'
  context.fillRect(0, 0, image.width, image.height)

  // Draw image onto the canvas, then convert the canvas contents to a Blob
  // (asynchronously).
  context.drawImage(image, 0, 0, image.width, image.height)

  return await canvas.convertToBlob()
}
