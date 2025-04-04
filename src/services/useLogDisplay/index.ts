import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type LogsDisplay,
  type LogDisplaysFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseLogDisplayReturn {
  error: Ref<string | undefined>
  logDisplay: ShallowRef<LogsDisplay | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useLogDisplay(
  baseUrl: string,
  logDisplayId: MaybeRefOrGetter<string | undefined>,
): UseLogDisplayReturn {
  const logDisplay = shallowRef<LogsDisplay>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadLogDisplay() {
    isLoading.value = true
    isReady.value = false

    try {
      const _logDisplayId = toValue(logDisplayId)
      if (_logDisplayId === undefined) {
        logDisplay.value = undefined
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: LogDisplaysFilter = {
        logDisplayId: _logDisplayId,
      }
      const response = await provider.getLogDisplays(filter)
      if (!response) throw new Error('LogDisplays response is undefined')

      logDisplay.value = response.logDisplays?.[0]
    } catch {
      error.value = 'Error loading logDisplays'
      logDisplay.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadLogDisplay)

  return {
    logDisplay,
    isReady,
    isLoading,
    error,
  }
}
