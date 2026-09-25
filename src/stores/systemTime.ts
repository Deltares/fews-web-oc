import { intervalToDateRange, type Interval } from '@/lib/TimeControl/interval'
import { defineStore } from 'pinia'
import {
  systemTimeAuthority,
  SystemTimeSyncSnapshot,
} from '@/services/system-time'
import { ref, watch } from 'vue'

export const CLOCK_TICK_MS = 1000
const RESYNC_INTERVAL_MS = 60_000

export const useSystemTimeStore = defineStore('systemTime', () => {
  let intervalTimer: ReturnType<typeof setInterval> | undefined = undefined
  let resyncTimer: ReturnType<typeof setInterval> | undefined = undefined

  const systemTime = ref(new Date())
  const lastSyncedAt = ref<Date>()
  const syncError = ref<string>()
  const startTime = ref<Date>()
  const endTime = ref<Date>()
  const selectedInterval = ref<Interval>('default')

  async function syncFromBackend() {
    syncError.value = undefined

    let snapshot: SystemTimeSyncSnapshot
    try {
      snapshot = await systemTimeAuthority.syncFromBackend()
    } catch (error) {
      snapshot = systemTimeAuthority.hasAnchor()
        ? {
            systemTime: systemTimeAuthority.now(),
            fetchedAtClientMs: Date.now(),
          }
        : systemTimeAuthority.setFallbackRunningNow()

      syncError.value = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to synchronise FEWS system time: ${syncError.value}`)
    }

    systemTime.value = snapshot.systemTime
    lastSyncedAt.value = new Date(snapshot.fetchedAtClientMs)
  }

  async function startClock() {
    await syncFromBackend()

    stopClock()
    intervalTimer = setInterval(() => {
      systemTime.value = systemTimeAuthority.now()
    }, CLOCK_TICK_MS)

    resyncTimer = setInterval(() => {
      void syncFromBackend()
    }, RESYNC_INTERVAL_MS)
  }

  function stopClock() {
    clearInterval(intervalTimer)
    clearInterval(resyncTimer)
    intervalTimer = undefined
    resyncTimer = undefined
  }

  watch(selectedInterval, () => {
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
  })

  void startClock()

  return {
    systemTime,
    lastSyncedAt,
    syncError,
    startTime,
    endTime,
    selectedInterval,
  }
})
