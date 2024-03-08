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
  documentFormat: string,
  accessToken: string,
) {
  try {
    const headers = new Headers()
    let extension: string = 'csv'
    if (documentFormat === DocumentFormat.PI_JSON.toString())
      extension = '.json'
    if (documentFormat === DocumentFormat.PI_XML.toString()) extension = '.xml'
    if (documentFormat === DocumentFormat.PI_CSV.toString()) extension = '.csv'
    const fileName = 'timeseries' + extension
    if (accessToken)
      await downloadFileWithFetch(headers, url, fileName, accessToken)
    if (!accessToken || accessToken == '') downloadWithLink(url, fileName)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}
