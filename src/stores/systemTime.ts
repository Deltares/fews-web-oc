import { intervalToDateRange, type Interval } from '@/lib/TimeControl/interval'
import { defineStore } from 'pinia'
import { systemTimeAuthority } from '@/services/system-time'
import type {
  SystemTimeBasis,
  SystemTimeUpdatePattern,
} from '@/services/system-time/model'
import { ref } from 'vue'

export const CLOCK_TICK_MS = 1000
const RESYNC_INTERVAL_MS = 60_000

export const useSystemTimeStore = defineStore('systemTime', () => {
  const systemTime = ref(new Date())
  const intervalTimer = ref<ReturnType<typeof setInterval>>()
  const resyncTimer = ref<ReturnType<typeof setInterval>>()
  const timeBasis = ref<SystemTimeBasis>('actual')
  const updatePattern = ref<SystemTimeUpdatePattern>('continuous')
  const updateIntervalMs = ref<number>()
  const lastSyncedAt = ref<Date>()
  const syncError = ref<string>()
  const startTime = ref<Date>()
  const endTime = ref<Date>()
  const selectedInterval = ref<Interval>('default')

  async function syncFromBackend() {
    try {
      const snapshot = await systemTimeAuthority.syncFromBackend()
      systemTime.value = snapshot.systemTime
      timeBasis.value = snapshot.timeBasis
      updatePattern.value = snapshot.updatePattern
      updateIntervalMs.value = snapshot.updateIntervalMs
      lastSyncedAt.value = new Date(snapshot.fetchedAtClientMs)
      syncError.value = undefined
    } catch (error) {
      const snapshot = systemTimeAuthority.hasAnchor()
        ? {
            systemTime: systemTimeAuthority.now(),
            timeBasis: systemTimeAuthority.timeBasis(),
            updatePattern: systemTimeAuthority.updatePattern(),
            updateIntervalMs: systemTimeAuthority.updateIntervalMs(),
            fetchedAtClientMs: Date.now(),
          }
        : systemTimeAuthority.setFallbackRunningNow()

      systemTime.value = snapshot.systemTime
      timeBasis.value = snapshot.timeBasis
      updatePattern.value = snapshot.updatePattern
      updateIntervalMs.value = snapshot.updateIntervalMs
      lastSyncedAt.value = new Date(snapshot.fetchedAtClientMs)
      syncError.value = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to synchronise FEWS system time: ${syncError.value}`)
    }
  }

  async function startClock() {
    await syncFromBackend()

    if (updatePattern.value === 'static') {
      stopClock()
      return
    }

    stopClock()
    intervalTimer.value = setInterval(() => {
      systemTime.value = systemTimeAuthority.now()
    }, CLOCK_TICK_MS)

    resyncTimer.value = setInterval(() => {
      void syncFromBackend()
    }, RESYNC_INTERVAL_MS)
  }

  function stopClock() {
    clearInterval(intervalTimer.value)
    clearInterval(resyncTimer.value)
    intervalTimer.value = undefined
    resyncTimer.value = undefined
  }

  function changeInterval() {
    if (selectedInterval.value === 'default') {
      startTime.value = undefined
      endTime.value = undefined
    } else if (selectedInterval.value !== 'custom') {
      const [newStartTime, newEndTime] = intervalToDateRange(
        selectedInterval.value,
        systemTime.value,
      )
      startTime.value = newStartTime
      endTime.value = newEndTime
    }
  }

  void startClock()

  return {
    systemTime,
    intervalTimer,
    resyncTimer,
    timeBasis,
    updatePattern,
    updateIntervalMs,
    lastSyncedAt,
    syncError,
    startTime,
    endTime,
    selectedInterval,
    syncFromBackend,
    startClock,
    stopClock,
    changeInterval,
  }
})
