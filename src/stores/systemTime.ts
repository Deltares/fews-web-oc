import type { Interval } from '@/lib/TimeControl/interval'
import { DateTime, Duration, type DurationLikeObject } from 'luxon'
import { defineStore } from 'pinia'

export interface SystemTimeStore {
  systemTime: Date
  intervalTimer: undefined | number | ReturnType<typeof setInterval>
  startTime: Date | undefined
  endTime: Date | undefined
  selectedInterval: Interval
}

function datePlusDuration(date: Date, duration: DurationLikeObject) {
  return DateTime.fromJSDate(date)
    .plus(Duration.fromObject(duration))
    .toJSDate()
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
          this.startTime = interval.start
            ? datePlusDuration(now, interval.start)
            : undefined
          this.endTime = interval.end
            ? datePlusDuration(now, interval.end)
            : undefined
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
