import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import {
  createSnapshot,
  resolveSystemTimeAt,
  type SystemTimeAnchor,
  type SystemTimeMode,
  type SystemTimeSyncSnapshot,
} from './model'

const SYSTEM_TIME_PATH = 'rest/fewspiservice/v1/systemtime'

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
    throw new Error(
      `FEWS system time response was not a valid ISO8601 timestamp: ${isoDateText}`,
    )
  }
  return parsed
}

export class SystemTimeAuthority {
  private anchor: SystemTimeAnchor | undefined

  async syncFromBackend(): Promise<SystemTimeSyncSnapshot> {
    const fewsBaseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const url = new URL(SYSTEM_TIME_PATH, `${fewsBaseUrl}/`).toString()
    const request = await createTransformRequestFn()(new Request(url))

    console.log(`Fetching FEWS system time from ${url}`)
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error(`Failed to fetch FEWS system time: ${response.status}`)
    }

    const systemTimeText = parseSystemTimePayload(await response.text())
    const fetchedAtClientMs = Date.now()
    const systemTime = parseIsoSystemTime(systemTimeText)
    this.anchor = {
      baseSystemTimeMs: systemTime.getTime(),
      fetchedAtClientMs,
      mode: 'running',
      updateIntervalMs: undefined,
    }

    return createSnapshot(this.anchor, Date.now())
  }

  setFallbackRunningNow(now = new Date()): SystemTimeSyncSnapshot {
    this.anchor = {
      baseSystemTimeMs: now.getTime(),
      fetchedAtClientMs: Date.now(),
      mode: 'running',
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

  mode(): SystemTimeMode {
    return this.anchor?.mode ?? 'running'
  }

  updateIntervalMs(): number | undefined {
    return this.anchor?.updateIntervalMs
  }
}

export const systemTimeAuthority = new SystemTimeAuthority()
