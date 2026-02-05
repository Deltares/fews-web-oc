import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type TaskRunsFilter,
  DocumentFormat,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watch } from 'vue'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'
import { Pausable } from '@vueuse/core'
import { convertFewsPiTaskRunToTaskRun, type TaskRun } from '@/lib/taskruns'

export function useTaskRuns(
  baseUrl: string,
  filter: MaybeRefOrGetter<TaskRunsFilter>,
  refreshInterval?: number,
) {
  const taskRuns = shallowRef<TaskRun[]>([])
  const isLoading = ref(false)
  const error = shallowRef<string>()
  const interval = ref<Pausable>()

  async function loadTaskRun() {
    isLoading.value = true

    try {
      const _filter = toValue(filter)

      if (!_filter.taskRunIds?.length && !_filter.topologyNodeId) {
        taskRuns.value = []
        return
      }

      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
        maxUrlLength: 8000,
      })

      const response = await provider.getTaskRuns({
        ..._filter,
        documentFormat: DocumentFormat.PI_JSON,
      })

      if (!response) throw new Error('TaskRuns response is undefined')

      taskRuns.value =
        response.taskRuns.map(convertFewsPiTaskRunToTaskRun) ?? []
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

  watch(() => toValue(filter), loadTaskRun)

  return {
    taskRuns,
    isLoading,
    interval,
    error,
  }
}
