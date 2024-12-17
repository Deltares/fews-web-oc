import { getResourcesStaticUrl } from '@/lib/fews-config'
import { defineStore } from 'pinia'
import type { Dashboard, DashboardsResponse } from '@/lib/dashboard/types'

interface State {
  dashboards: Dashboard[]
}

export const useDashboardsStore = defineStore('dashboards', {
  state: (): State => ({
    dashboards: [],
  }),
  actions: {
    async fetchState() {
      const url = getResourcesStaticUrl('dashboards.json')
      if (this.dashboards.length > 0) return

      const response = await fetch(url)
      const data: DashboardsResponse = await response.json()
      this.dashboards = data.dashboards
      this.dashboards.forEach((dashboard) => {
        dashboard.cssTemplate = getResourcesStaticUrl(dashboard.cssTemplate)
      })
    },
    getDashboardById(id: string): Dashboard | undefined {
      return this.dashboards.find((d) => d.id === id)
    },
  },
})
