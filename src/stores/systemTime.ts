import { intervalToDateRange, type Interval } from '@/lib/TimeControl/interval'
import { defineStore } from 'pinia'
import {
  systemTimeAuthority,
} from '@/services/system-time'
import type { SystemTimeMode } from '@/services/system-time/model'

export interface SystemTimeStore {
  systemTime: Date
  intervalTimer: undefined | number | ReturnType<typeof setInterval>
  resyncTimer: undefined | number | ReturnType<typeof setInterval>
  mode: SystemTimeMode
  updateIntervalMs: number | undefined
  lastSyncedAt: Date | undefined
  syncError: string | undefined
  startTime: Date | undefined
  endTime: Date | undefined
  selectedInterval: Interval
}

export const CLOCK_TICK_MS = 1000
const RESYNC_INTERVAL_MS = 60_000

export const useSystemTimeStore = () => {
  const store = defineStore('systemTime', {
    state: (): SystemTimeStore => ({
      systemTime: new Date(),
      intervalTimer: undefined,
      resyncTimer: undefined,
      mode: 'running',
      updateIntervalMs: undefined,
      lastSyncedAt: undefined,
      syncError: undefined,
      startTime: undefined,
      endTime: undefined,
      selectedInterval: 'default',
    }),
    actions: {
      async syncFromBackend() {
        try {
          const snapshot = await systemTimeAuthority.syncFromBackend()
          this.systemTime = snapshot.systemTime
          this.mode = snapshot.mode
          this.updateIntervalMs = snapshot.updateIntervalMs
          this.lastSyncedAt = new Date(snapshot.fetchedAtClientMs)
          this.syncError = undefined
        } catch (error) {
          const snapshot = systemTimeAuthority.hasAnchor()
            ? {
                systemTime: systemTimeAuthority.now(),
                mode: systemTimeAuthority.mode(),
                updateIntervalMs: systemTimeAuthority.updateIntervalMs(),
                fetchedAtClientMs: Date.now(),
              }
            : systemTimeAuthority.setFallbackRunningNow()

          this.systemTime = snapshot.systemTime
          this.mode = snapshot.mode
          this.updateIntervalMs = snapshot.updateIntervalMs
          this.lastSyncedAt = new Date(snapshot.fetchedAtClientMs)
          this.syncError = error instanceof Error ? error.message : String(error)
          console.warn(`Failed to synchronise FEWS system time: ${this.syncError}`)
        }
      },
      async startClock() {
        await this.syncFromBackend()

        if (this.mode === 'static') {
          this.stopClock()
          return
        }

        this.stopClock()
        this.intervalTimer = setInterval(() => {
          this.systemTime = systemTimeAuthority.now()
        }, CLOCK_TICK_MS)

        this.resyncTimer = setInterval(() => {
          void this.syncFromBackend()
        }, RESYNC_INTERVAL_MS)
      },
      stopClock() {
        clearInterval(this.intervalTimer)
        clearInterval(this.resyncTimer)
        this.intervalTimer = undefined
        this.resyncTimer = undefined
      },
      changeInterval() {
        if (this.selectedInterval === 'default') {
          // Use the FEWS default time interval.
          this.startTime = undefined
          this.endTime = undefined
        } else if (this.selectedInterval === 'custom') {
          // Use the custom time interval.
        } else {
          const now = this.systemTime
          const interval = this.selectedInterval
          const [startTime, endTime] = intervalToDateRange(interval, now)
          this.startTime = startTime
          this.endTime = endTime
        }
      },
    },
  })
  const s = store()
  if (s.intervalTimer === undefined) {
    s.startClock()
  }
  return s
}
