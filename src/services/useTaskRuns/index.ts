import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type TaskRun,
  type TaskRunsFilter,
  DocumentFormat,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watch } from 'vue'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'
import { Pausable } from '@vueuse/core'

export function useTaskRuns(
  baseUrl: string,
  taskRunIds: MaybeRefOrGetter<string[]>,
  refreshInterval?: number,
) {
  const taskRuns = shallowRef<TaskRun[]>([])
  const isLoading = ref(false)
  const error = shallowRef<string>()
  const interval = ref<Pausable>()

  async function loadTaskRun() {
    isLoading.value = true

    try {
      const _taskRunIds = toValue(taskRunIds)
      if (!_taskRunIds.length) {
        taskRuns.value = []
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
        maxUrlLength: 8000,
      })
      const filter: TaskRunsFilter = {
        taskRunIds: _taskRunIds,
        documentFormat: DocumentFormat.PI_JSON,
      }
      const response = await provider.getTaskRuns(filter)
      if (!response) throw new Error('TaskRuns response is undefined')

      taskRuns.value = response.taskRuns ?? []
    } catch {
      error.value = 'Error loading taskRuns'
      taskRuns.value = []
    } finally {
      isLoading.value = false
    }
  }

  if (refreshInterval) {
    interval.value = useFocusAwareInterval(loadTaskRun, refreshInterval, {
      immediateCallback: true,
    })
  } else {
    loadTaskRun()
  }

  watch(() => toValue(taskRunIds), loadTaskRun)

  return {
    taskRuns,
    isLoading,
    interval,
    error,
  }
}
