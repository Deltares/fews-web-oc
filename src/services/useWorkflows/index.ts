import { downloadFileWithXhr } from '@/lib/download'
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
  return downloadFileWithXhr(url.toString())
}
