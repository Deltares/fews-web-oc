import {
  WMSProvider,
  type GetCapabilitiesResponse,
  type Layer,
} from '@deltares/fews-wms-requests'
import { toDateRangeString, toHumanReadableDateTime } from '@/lib/date'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export function getForecastTime(capabilities: Layer | undefined) {
  const forecastTime = capabilities?.keywordList?.[0].forecastTime
  if (!forecastTime) return

  return new Date(forecastTime)
}

export function getForecastTimeString(capabilities: Layer | undefined) {
  const forecastTime = getForecastTime(capabilities)
  if (!forecastTime) return

  if (isNaN(forecastTime.getTime())) {
    return 'Analysis time not available'
  }

  return `Analysis time: ${toHumanReadableDateTime(forecastTime)}`
}

export function getValueTimeRangeString(capabilities: Layer | undefined) {
  if (capabilities?.completelyMissing ?? false)
    return 'Currently no data available'

  return toDateRangeString(
    capabilities?.firstValueTime,
    capabilities?.lastValueTime,
  )
}

let cachedCapabilities: GetCapabilitiesResponse | null = null
let capabilitiesPromise: Promise<GetCapabilitiesResponse> | null = null

export async function fetchWmsCapabilitiesHeaders() {
  if (cachedCapabilities) {
    return cachedCapabilities
  }
  if (capabilitiesPromise) {
    return await capabilitiesPromise
  }

  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const wmsUrl = `${baseUrl}/wms`
  const provider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  capabilitiesPromise = provider.getCapabilities({ onlyHeaders: true })

  try {
    const capabilities = await capabilitiesPromise
    cachedCapabilities = capabilities
    return capabilities
  } finally {
    capabilitiesPromise = null
  }
}
