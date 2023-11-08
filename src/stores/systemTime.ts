import { DateTime, Duration } from 'luxon'
import { defineStore } from 'pinia'

export interface SystemTimeStore {
  systemTime: Date
  intervalTimer: undefined | number | ReturnType<typeof setInterval>
  startTime: Date | null
  endTime: Date | null
  selectedInterval: string
}

export const useSystemTimeStore = () => {
  const store = defineStore({
    id: 'systemTime',
    state: (): SystemTimeStore => ({
      systemTime: new Date(),
      intervalTimer: undefined,
      startTime: null,
      endTime: null,
      selectedInterval: 'default',
    }),
    actions: {
      startClock() {
        this.systemTime = new Date()
        this.intervalTimer = setInterval(() => {
          this.systemTime = new Date()
        }, 1000)
      },
      stopClock() {
        clearInterval(this.intervalTimer)
        this.intervalTimer = undefined
      },
      changeInterval() {
        if (!this.selectedInterval) return

        if (this.selectedInterval === 'default') {
          // Use the FEWS default time interval.
          this.startTime = null
          this.endTime = null
        } else if (this.selectedInterval === 'custom') {
          // Use the custom time interval.
        } else {
          const now = this.systemTime
          const interval = this.selectedInterval.split('/')
          if (interval.length === 2) {
            this.endTime = DateTime.fromJSDate(now)
              .plus(Duration.fromISO(interval[1]))
              .toJSDate()
            this.startTime = DateTime.fromJSDate(now)
              .plus(Duration.fromISO(interval[0]))
              .toJSDate()
          } else if (interval.length === 1) {
            this.endTime = null
            this.startTime = DateTime.fromJSDate(now)
              .plus(Duration.fromISO(interval[0]))
              .toJSDate()
          }
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
