import type { LogMessage } from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type LogDisplayLogsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export function useLogDisplayLogs(
  baseUrl: string,
  filters: MaybeRefOrGetter<LogDisplayLogsFilter[]>,
) {
  const logMessages = shallowRef<LogMessage[]>([])
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadLogDisplayLogs() {
    isLoading.value = true
    isReady.value = false

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const _filters = toValue(filters)

      const fetchLogsForFilter = async (filter: LogDisplayLogsFilter) => {
        const response = await provider.getLogDisplayLogs(filter)
        if (!response) throw new Error('LogDisplayLogs response is undefined')

        const logs =
          response.logs?.map((log) => ({
            ...log,
            type: filter.logType ?? 'system',
            taskRunId: cleanTaskRunId(log.taskRunId),
          })) ?? []

        return logs
      }

      const logPromises = _filters.map(fetchLogsForFilter)
      const newLogs = await Promise.all(logPromises)

      logMessages.value = newLogs
        .flat()
        .toSorted((a, b) => b.entryTime.localeCompare(a.entryTime))
    } catch {
      error.value = 'Error loading logDisplayLogs'
      logMessages.value = []
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadLogDisplayLogs)

  return {
    logMessages,
    isReady,
    isLoading,
    error,
  }
}


// FIXME: Always has a space followed by -1 for some reason
function cleanTaskRunId(taskRunId: string): string {
  return taskRunId.split(' ')[0]
}
