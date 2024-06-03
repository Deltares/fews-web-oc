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
    addAlert(id: string, type: AlertType, message: string) {
      this.alerts.push({
        id,
        type,
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
