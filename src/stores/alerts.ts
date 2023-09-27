import { defineStore } from 'pinia'

export interface Alert {
  id: string
  message: string
  active: boolean
}

interface AlertState {
  alerts: Alert[]
}

const useAlertsStore = defineStore('alerts', {
  state: (): AlertState => ({
    alerts: [],
  }),

  actions: {
    addAlert(id: string, message: string) {
      this.alerts.push({
        id,
        message,
        active: true,
      })
    },
  },

  getters: {
    activeAlerts: (state) => state.alerts.filter((alert) => alert.active),
    hasActiveAlerts: (state) => state.alerts.some((alert) => alert.active),
  },
})

export { useAlertsStore }
