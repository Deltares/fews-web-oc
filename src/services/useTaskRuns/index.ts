import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type TaskRun,
  type TaskRunsFilter,
  DocumentFormat,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseTaskRunReturn {
  error: Ref<string | undefined>
  taskRuns: ShallowRef<TaskRun[]>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useTaskRuns(
  baseUrl: string,
  taskRunIds: MaybeRefOrGetter<string[]>,
): UseTaskRunReturn {
  const taskRuns = shallowRef<TaskRun[]>([])
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadTaskRun() {
    isLoading.value = true
    isReady.value = false

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
      isReady.value = true
    }
  }

  watchEffect(loadTaskRun)

  return {
    taskRuns,
    isReady,
    isLoading,
    error,
  }
}
