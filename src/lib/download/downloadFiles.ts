import { DocumentFormat } from '@deltares/fews-pi-requests'

function downloadWithLink(url: string, fileName: string) {
  const encodedFileName = encodeURIComponent(fileName)
  url = `${url}&downloadAsFile=${encodedFileName}`
  clickDownloadUrl(url, fileName)
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
}

export async function downloadFileWithXhr(
  url: string | URL,
  fileName: string,
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

export function clickDownloadBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  clickDownloadUrl(blobUrl, fileName)
  window.URL.revokeObjectURL(blobUrl)
}

export function clickDownloadUrl(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', fileName)

  document.body.appendChild(a)
  a.click()
  a.remove()
}
