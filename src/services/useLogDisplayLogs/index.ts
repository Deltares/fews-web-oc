import type { LogMessage } from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type LogDisplayLogsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, shallowRef, toValue, watchEffect } from 'vue'

export function useLogDisplayLogs(
  baseUrl: string,
  filters: MaybeRefOrGetter<LogDisplayLogsFilter[]>,
) {
  const logMessages = shallowRef<LogMessage[]>([])
  const systemLogMessages = computed(() => {
    return logMessages.value.filter((log) => log.type === 'system')
  })
  const manualLogMessages = computed(() => {
    return logMessages.value.filter((log) => log.type === 'manual')
  })
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
          })) ?? []

        return logs
      }

      const logPromises = _filters.map(fetchLogsForFilter)
      const newLogs = await Promise.all(logPromises)

      logMessages.value = newLogs.flat()
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
    systemLogMessages,
    manualLogMessages,
    isReady,
    isLoading,
    error,
  }
}
