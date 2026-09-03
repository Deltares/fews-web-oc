import {
  createSnapshot,
  resolveSystemTimeAt,
  type SystemTimeAnchor,
  type SystemTimeBasis,
  type SystemTimeUpdatePattern,
  type SystemTimeSyncSnapshot,
} from './model'
import { fetchFewsIsoTimestamp } from './fetch'

const ACTUAL_TIME_TOLERANCE_MS = 1_000

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
