import {
  PiWebserviceProvider,
  ProcessDataFilter,
} from '@deltares/fews-pi-requests'

export async function downloadNetCDF(
  baseUrl: string,
  dataFilter: ProcessDataFilter,
) {
  const piProvider = new PiWebserviceProvider(baseUrl)
  const url = piProvider.processDataUrl(dataFilter)
  return downloadUrl(url.toString())
}

async function downloadUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.responseType = 'blob'
    req.open('GET', url)

    req.onload = () => {
      if (req.status < 200 || req.status >= 300) {
        reject({
          status: req.status,
          statusText: req.statusText || 'Error downloading file',
        })
        req.response
          .text()
          .then((text: string) =>
            console.error(`NetCDF download error: ${text}`),
          )
        return
      }

      const fileName = url.substring(url.lastIndexOf('/'))
      const blobUrl = window.URL.createObjectURL(req.response)

      const a = document.createElement('a')
      a.href = blobUrl
      a.setAttribute('download', fileName)

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
