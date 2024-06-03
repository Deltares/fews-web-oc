import { defineStore } from 'pinia'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface Alert {
  id: string
  type: AlertType
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
    addAlert(alert: Alert) {
      this.alerts.push(alert)
    },
    deactiveAlert(id: string) {
      const alert = this.alerts.find((alert) => alert.id === id)
      if (alert) {
        alert.active = false
      }
    },
  },

  getters: {
    activeAlerts: (state) => state.alerts.filter((alert) => alert.active),
    hasActiveAlerts: (state) => state.alerts.some((alert) => alert.active),
  },
})

export { useAlertsStore }
