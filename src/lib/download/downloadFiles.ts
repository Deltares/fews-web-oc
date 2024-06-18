import { DocumentFormat } from '@deltares/fews-pi-requests'
import { toISOString } from '../date'

function downloadWithLink(url: string, fileName: string) {
  const encodedFileName = encodeURIComponent(fileName)
  url = `${url}&downloadAsFile=${encodedFileName}`
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    console.error('Error downloading file')
  }
}

export function filterToParams(filter: Record<string, any>): string {
  const filterArgs = Object.entries(filter).flatMap(([key, value]) => {
    if (value === undefined) return []

    const encodedValue = encodeURIComponent(value)
    return [`${key}=${encodedValue}`]
  })

  return filterArgs.length ? '?' + filterArgs.join('&') : ''
}
export async function downloadFileAttachment(
  url: string,
  fileName: string,
  documentFormat: string,
  accessToken: string,
) {
  try {
    const headers = new Headers()
    if (accessToken) {
      let extension: string = 'csv'
      if (documentFormat === DocumentFormat.PI_JSON) extension = '.json'
      if (documentFormat === DocumentFormat.PI_XML) extension = '.xml'
      if (documentFormat === DocumentFormat.PI_CSV) extension = '.csv'
      const downloadFileName = fileName + extension
      await downloadFileWithFetch(headers, url, downloadFileName, accessToken)
    }
    if (!accessToken || accessToken == '') downloadWithLink(url, fileName)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}

export async function downloadFileWithXhr(
  url: string,
  fileNameSuffix?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.responseType = 'blob'
    req.open('GET', url)

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

      // For when backend does not set 'Access-Control-Expose-Headers: Content-Disposition'
      const now = toISOString(new Date())
        .replaceAll('-', '')
        .replaceAll(':', '')
      const fallBackFileName = `${now}${fileNameSuffix ?? '_DATA'}`

      const downloadFileName = headerFileName ?? fallBackFileName
      const blobUrl = window.URL.createObjectURL(req.response)

      const a = document.createElement('a')
      a.href = blobUrl
      a.setAttribute('download', downloadFileName)

      document.body.appendChild(a)
      a.click()

      a.remove()
      window.URL.revokeObjectURL(blobUrl)

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
