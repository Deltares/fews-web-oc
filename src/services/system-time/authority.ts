import {
  createSnapshot,
  resolveSystemTimeAt,
  type SystemTimeAnchor,
  type SystemTimeSyncSnapshot,
} from './model'
import { fetchFewsIsoTimestamp } from './fetch'

export class SystemTimeAuthority {
  private anchor: SystemTimeAnchor | undefined

  async syncFromBackend(): Promise<SystemTimeSyncSnapshot> {
    const systemTime = await fetchFewsIsoTimestamp()

    const fetchedAtClientMs = Date.now()
    const systemTimeMs = systemTime.getTime()

    this.anchor = {
      baseSystemTimeMs: systemTimeMs,
      fetchedAtClientMs,
    }

    return createSnapshot(this.anchor, Date.now())
  }

  setFallbackRunningNow(now = new Date()): SystemTimeSyncSnapshot {
    this.anchor = {
      baseSystemTimeMs: now.getTime(),
      fetchedAtClientMs: Date.now(),
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
}

export const systemTimeAuthority = new SystemTimeAuthority()
