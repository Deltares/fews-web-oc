import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider, type Report } from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseReportsReturn {
  error: Ref<string | undefined>
  reports: ShallowRef<Report[] | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useReports(
  baseUrl: string,
  moduleInstanceIds: MaybeRefOrGetter<string[]>,
): UseReportsReturn {
  const reports = shallowRef<Report[]>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadReports() {
    const _moduleInstanceIds = toValue(moduleInstanceIds)
    if (_moduleInstanceIds.length === 0) return

    isLoading.value = true
    isReady.value = false
    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await provider.getReports({
        moduleInstanceIds: _moduleInstanceIds,
      })
      reports.value = response.reports
    } catch {
      error.value = 'Error loading reports'
      reports.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadReports)

  return {
    reports,
    isReady,
    isLoading,
    error,
  }
}
