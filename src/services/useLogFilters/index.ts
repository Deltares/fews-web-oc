import { getManualFilters, getSystemFilters } from '@/lib/log'
import {
  ForecasterNoteGroup,
  LogDisplayLogsFilter,
  LogsDisplay,
} from '@deltares/fews-pi-requests'
import { refDebounced } from '@vueuse/core'
import { computed, MaybeRefOrGetter, toValue } from 'vue'

export function useLogFilters(
  baseFilters: MaybeRefOrGetter<LogDisplayLogsFilter>,
  noteGroup: MaybeRefOrGetter<ForecasterNoteGroup | undefined>,
  logDisplay: MaybeRefOrGetter<LogsDisplay | undefined>,
) {
  const manualFilters = computed(() => {
    const _noteGroup = toValue(noteGroup)
    const _baseFilters = toValue(baseFilters)

    const manualEventCodeId = _noteGroup?.note.eventCodeId
    return manualEventCodeId
      ? getManualFilters(_baseFilters, manualEventCodeId)
      : []
  })

  const systemFilters = computed(() => {
    const _logDisplay = toValue(logDisplay)
    const _baseFilters = toValue(baseFilters)

    const systemLogSettings = _logDisplay?.systemLog
    return systemLogSettings
      ? getSystemFilters(_baseFilters, systemLogSettings)
      : []
  })

  // To keep requests in sync between manual and system logs
  const filters = computed(() => {
    const _logDisplay = toValue(logDisplay)

    const hasManual = _logDisplay?.manualLog
    const hasSystem = _logDisplay?.systemLog
    if (
      (hasManual && !manualFilters.value.length) ||
      (hasSystem && !systemFilters.value.length)
    ) {
      return {
        manual: [],
        system: [],
      }
    }

    return {
      manual: manualFilters.value,
      system: systemFilters.value,
    }
  })

  const requestDebounce = 500
  const debouncedFilters = refDebounced(filters, requestDebounce)

  return {
    manualFilters,
    systemFilters,
    debouncedFilters,
  }
}
