import type { LogMessage } from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type LogDisplayLogsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, shallowRef, toValue, watchEffect } from 'vue'

type DateSeparatorItem = {
  type: 'dateSeparator'
  date: string
}

type GroupedLogItem = {
  type: 'logItem'
  logs: LogMessage[]
}

export type VirtualScrollItem = DateSeparatorItem | GroupedLogItem

function getDateString(entryTime: string): string {
  const date = new Date(entryTime)
  return date.toISOString().split('T')[0]
}

function groupByTaskRunId(logs: LogMessage[]): VirtualScrollItem[] {
  const logsByDate: Record<string, LogMessage[]> = {}

  logs.forEach((log) => {
    const dateStr = getDateString(log.entryTime)
    if (!logsByDate[dateStr]) {
      logsByDate[dateStr] = []
    }
    logsByDate[dateStr].push(log)
  })

  const result: VirtualScrollItem[] = []
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a))

  sortedDates.forEach((date) => {
    result.push({
      type: 'dateSeparator',
      date,
    })

    const logsForDate = logsByDate[date]
    const groupedByTaskId = logsForDate.reduce(
      (grouped, log) => {
        const taskRunId =
          log.type === 'system'
            ? log.taskRunId
            : `${log.taskRunId}-${log.id}-${log.user}`

        if (!grouped[taskRunId]) {
          grouped[taskRunId] = []
        }

        grouped[taskRunId].push(log)
        return grouped
      },
      {} as Record<string, LogMessage[]>,
    )

    Object.values(groupedByTaskId).forEach((taskRunLogs) => {
      result.push({
        type: 'logItem',
        logs: taskRunLogs,
      })
    })
  })

  return result
}

export function useLogDisplayLogs(
  baseUrl: string,
  filters: MaybeRefOrGetter<{
    manual: LogDisplayLogsFilter[]
    system: LogDisplayLogsFilter[]
  }>,
  customFilter?: (log: LogMessage) => boolean,
) {
  const systemLogMessages = shallowRef<LogMessage[]>([])
  const manualLogMessages = shallowRef<LogMessage[]>([])

  const manualIsLoading = ref(false)
  const systemIsLoading = ref(false)
  const error = shallowRef<string>()

  const logMessages = computed(() => {
    if (
      (manualIsLoading.value || systemIsLoading.value) &&
      manualLogMessages.value.length === 0 &&
      systemLogMessages.value.length === 0
    ) {
      return []
    }
    return [...manualLogMessages.value, ...systemLogMessages.value].toSorted(
      (a, b) => b.entryTime.localeCompare(a.entryTime),
    )
  })

  const isLoading = computed(
    () => manualIsLoading.value || systemIsLoading.value,
  )

  async function loadManualLogDisplayLogs() {
    manualIsLoading.value = true

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const _filters = toValue(filters).manual

      const fetchLogsForFilter = async (filter: LogDisplayLogsFilter) => {
        const response = await provider.getLogDisplayLogs(filter)
        if (!response) throw new Error('LogDisplayLogs response is undefined')

        const logs =
          response.logs?.map((log) => ({
            ...log,
            type: filter.logType ?? 'manual',
            taskRunId: cleanTaskRunId(log.taskRunId),
          })) ?? []

        return logs
      }

      const logPromises = _filters.map(fetchLogsForFilter)
      const newLogs = await Promise.all(logPromises)

      manualLogMessages.value = newLogs.flat()
    } catch {
      error.value = 'Error loading logDisplayLogs'
      manualLogMessages.value = []
    } finally {
      manualIsLoading.value = false
    }
  }

  async function loadSystemLogDisplayLogs() {
    systemIsLoading.value = true

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const _filters = toValue(filters).system

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

      systemLogMessages.value = newLogs.flat()
    } catch {
      error.value = 'Error loading logDisplayLogs'
      systemLogMessages.value = []
    } finally {
      systemIsLoading.value = false
    }
  }

  const filteredLogMessages = computed(() => {
    // Filter log messages based on selected levels, types, search text, task runs, and workflows
    // We filter in two passes, first we find which taskRuns have any logs that match the filter criteria
    // and then we filter the log messages based on those taskRuns.
    const filteredTaskRunIds = new Set<string>()

    logMessages.value
      .filter((log) => (customFilter ? customFilter(log) : true))
      .forEach((log) => filteredTaskRunIds.add(log.taskRunId))
    return logMessages.value.filter(
      (log) =>
        (customFilter ? customFilter(log) : true) ||
        filteredTaskRunIds.has(log.taskRunId),
    )
  })

  const groupedByTaskRunId = computed(() => {
    return groupByTaskRunId(filteredLogMessages.value)
  })

  watchEffect(loadManualLogDisplayLogs)
  watchEffect(loadSystemLogDisplayLogs)

  return {
    logMessages,
    filteredLogMessages,
    groupedByTaskRunId,
    isLoading,
    error,
  }
}

// FIXME: Always has a space followed by -1 for some reason
function cleanTaskRunId(taskRunId: string): string {
  return taskRunId.split(' ')[0]
}
