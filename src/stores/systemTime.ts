import { intervalToDateRange, type Interval } from '@/lib/TimeControl/interval'
import { defineStore } from 'pinia'

export interface SystemTimeStore {
  systemTime: Date
  intervalTimer: undefined | number | ReturnType<typeof setInterval>
  startTime: Date | undefined
  endTime: Date | undefined
  selectedInterval: Interval
}

export const useSystemTimeStore = () => {
  const store = defineStore('systemTime', {
    state: (): SystemTimeStore => ({
      systemTime: new Date(),
      intervalTimer: undefined,
      startTime: undefined,
      endTime: undefined,
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
