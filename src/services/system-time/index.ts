import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import {
  createSnapshot,
  resolveSystemTimeAt,
  type SystemTimeAnchor,
  type SystemTimeBasis,
  type SystemTimeUpdatePattern,
  type SystemTimeSyncSnapshot,
} from './model'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

const ACTUAL_TIME_TOLERANCE_MS = 1_000

async function fetchFewsIsoTimestamp(): Promise<Date> {
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

export class SystemTimeAuthority {
  private anchor: SystemTimeAnchor | undefined

  async syncFromBackend(): Promise<SystemTimeSyncSnapshot> {
    const systemTime = await fetchFewsIsoTimestamp()

    const fetchedAtClientMs = Date.now()
    const systemTimeMs = systemTime.getTime()
    let updatePattern: SystemTimeUpdatePattern = 'continuous'

    const timeBasis: SystemTimeBasis =
      Math.abs(systemTimeMs - fetchedAtClientMs) <= ACTUAL_TIME_TOLERANCE_MS
        ? 'actual'
        : 'offset'

    this.anchor = {
      baseSystemTimeMs: systemTimeMs,
      fetchedAtClientMs,
      timeBasis,
      updatePattern,
      updateIntervalMs: undefined,
    }

    return createSnapshot(this.anchor, Date.now())
  }

  setFallbackRunningNow(now = new Date()): SystemTimeSyncSnapshot {
    this.anchor = {
      baseSystemTimeMs: now.getTime(),
      fetchedAtClientMs: Date.now(),
      timeBasis: 'client',
      updatePattern: 'continuous',
    }

    return createSnapshot(this.anchor, Date.now())
  }

  hasAnchor(): boolean {
    return this.anchor !== undefined
  }

  now(): Date {
    if (!this.anchor) {
      return new Date()
    }
    return resolveSystemTimeAt(this.anchor, Date.now())
  }

  timeBasis(): SystemTimeBasis {
    return this.anchor?.timeBasis ?? 'actual'
  }

  updatePattern(): SystemTimeUpdatePattern {
    return this.anchor?.updatePattern ?? 'continuous'
  }

  updateIntervalMs(): number | undefined {
    return this.anchor?.updateIntervalMs
  }
}

export const systemTimeAuthority = new SystemTimeAuthority()
