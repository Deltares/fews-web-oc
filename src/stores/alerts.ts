import { uid } from '@/lib/utils/uid'
import { defineStore } from 'pinia'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface Alert {
  id: string
  type: AlertType
  message: string
}

interface AlertState {
  alerts: Alert[]
}

const useAlertsStore = defineStore('alerts', {
  state: (): AlertState => ({
    alerts: [],
  }),

  actions: {
    addAlert(alert: Omit<Alert, 'id'>) {
      this.alerts.push({
        id: uid(),
        ...alert,
      })
    },
    removeAlert(id: string) {
      this.alerts = this.alerts.filter((alert) => alert.id !== id)
    },
  },

  getters: {
    hasAlerts: (state) => state.alerts.length > 0,
  },
})

export { useAlertsStore }
