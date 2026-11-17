import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

export async function fetchFewsIsoTimestamp(): Promise<Date> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

  try {
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })
    const time = await piProvider.getSystemTime()
    return parseIsoSystemTime(parseSystemTimePayload(time))
  } catch (error) {
    throw new Error(`Failed to fetch FEWS system time: ${error}`)
  }
}

function parseSystemTimePayload(rawPayload: string): string {
  const trimmed = rawPayload.trim()
  if (trimmed.length === 0) {
    throw new Error('FEWS system time response was empty')
  }
  return trimmed
}

function parseIsoSystemTime(isoDateText: string): Date {
  const parsed = new Date(isoDateText)
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(
      `FEWS system time response was not a valid ISO8601 timestamp: ${isoDateText}`,
    )
  }
  return parsed
}
