import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type WebOCDashboard,
  type DashboardsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseDashboardReturn {
  error: Ref<string | undefined>
  dashboard: ShallowRef<WebOCDashboard | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useDashboard(
  baseUrl: string,
  dashboardId: MaybeRefOrGetter<string | undefined>,
): UseDashboardReturn {
  const dashboard = shallowRef<WebOCDashboard>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadDashboard() {
    isLoading.value = true
    isReady.value = false

    try {
      const _dashboardId = toValue(dashboardId)
      if (_dashboardId === undefined) {
        dashboard.value = undefined
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: DashboardsFilter = {
        dashboardId: _dashboardId,
      }
      const response = await provider.getDashboards(filter)
      if (!response) throw new Error('Dashboards response is undefined')

      dashboard.value = response.dashboards?.[0]
    } catch {
      error.value = 'Error loading dashboards'
      dashboard.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadDashboard)

  return {
    dashboard,
    isReady,
    isLoading,
    error,
  }
}
