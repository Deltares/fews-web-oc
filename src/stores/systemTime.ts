import { defineStore } from 'pinia'

export interface SystemTimeStore {
  systemTime: Date
  intervalTimer: undefined | number | ReturnType<typeof setInterval>
}
export const useSystemTimeStore = defineStore({
  id: 'systemTime',
  state: (): SystemTimeStore => ({
    systemTime: new Date(),
    intervalTimer: undefined,
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
  },
  getters: {
    getSystemTime: (state) => {
      return state.systemTime
    },
  },
})
