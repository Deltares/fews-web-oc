import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DocumentFormat,
  PiWebserviceProvider,
  type TaskRunStatusFilter,
  type TaskRunStatusResponse,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { useRefreshCoordinator } from '@/services/useRefreshCoordinator'
import { Pausable } from '@vueuse/core'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const provider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export function useTaskRunStatus(
  filter: MaybeRefOrGetter<TaskRunStatusFilter | undefined>,
  refreshInterval?: number,
) {
  const taskRunStatus = shallowRef<TaskRunStatusResponse>()
  const isLoading = ref(false)
  const error = shallowRef<string>()
  const interval = ref<Pausable>()

  async function loadTaskRunStatus() {
    const _filter = toValue(filter)

    if (_filter === undefined) {
      taskRunStatus.value = undefined
      return
    }

    isLoading.value = true
    try {
      taskRunStatus.value = await provider.getTaskRunStatus({
        ..._filter,
        documentFormat: DocumentFormat.PI_JSON,
      })
    } catch {
      error.value = 'Error loading task run status'
      taskRunStatus.value = undefined
    } finally {
      isLoading.value = false
    }
  }

  if (refreshInterval) {
    interval.value = useRefreshCoordinator(loadTaskRunStatus, {
      policies: ['onSystemTick', 'onInterval', 'onVisibilityResume', 'manual'],
      intervalMs: refreshInterval,
      immediateCallback: true,
    })
  } else {
    loadTaskRunStatus()
  }

  watch(() => toValue(filter), loadTaskRunStatus)

  return {
    taskRunStatus,
    isLoading,
    interval,
    error,
  }
}
