import { DocumentFormat } from '@deltares/fews-pi-requests'

function downloadWithLink(url: string, fileName: string) {
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

export async function downloadFileAttachment(
  url: string,
  fileName: string,
  documentFormat: string,
  accessToken: string,
) {
  try {
    const headers = new Headers()
    let extension: string = 'csv'
    if (documentFormat === DocumentFormat.PI_JSON) extension = '.json'
    if (documentFormat === DocumentFormat.PI_XML) extension = '.xml'
    if (documentFormat === DocumentFormat.PI_CSV) extension = '.csv'
    const downloadFileName = fileName + extension
    if (accessToken)
      await downloadFileWithFetch(headers, url, downloadFileName, accessToken)
    if (!accessToken || accessToken == '')
      downloadWithLink(url, downloadFileName)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}
