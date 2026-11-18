import {
  type DynamicReportDisplayFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { getRequestHeaders } from '@/lib/requests/transformRequest'
import { downloadFileWithXhr } from './downloadFiles'

export function getDynamicReportFileName(
  filter: Partial<
    Pick<DynamicReportDisplayFilter, 'displayId' | 'locationId' | 'time'>
  >,
): string {
  return [filter.displayId, filter.locationId, filter.time]
    .filter(Boolean)
    .join('-')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
}

export async function downloadDynamicReport(
  baseUrl: string,
  filter: DynamicReportDisplayFilter,
) {
  const provider = new PiWebserviceProvider(baseUrl)
  const url = provider.dynamicReportDisplayUrl({
    useLastValue: true,
    ...filter,
  })
  const headers = await getRequestHeaders()
  await downloadFileWithXhr(
    url,
    `${getDynamicReportFileName(filter)}.html`,
    headers,
  )
}
