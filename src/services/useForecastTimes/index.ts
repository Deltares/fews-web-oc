import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type ForecastTimesFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

// TODO: Can be optimized to ask for more next and previous time zeros and cache valid forecast times.
export function useForecastTimes(
  baseUrl: string,
  workflowId: MaybeRefOrGetter<string | undefined>,
  timeZero: MaybeRefOrGetter<string | undefined>,
) {
  const selectedTimeZero = ref<string>()
  const previousTimeZero = ref<string>()
  const nextTimeZero = ref<string>()
  const valid = ref<boolean>()

  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  function reset() {
    selectedTimeZero.value = undefined
    previousTimeZero.value = undefined
    nextTimeZero.value = undefined
    valid.value = false
  }

  async function loadForecastTimes() {
    isLoading.value = true
    isReady.value = false

    try {
      const _workflowId = toValue(workflowId)
      const _timeZero = toValue(timeZero)
      if (_workflowId === undefined || _timeZero === undefined) {
        reset()
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: ForecastTimesFilter = {
        workflowId: _workflowId,
        timeZero: _timeZero,
      }
      const response = await provider.getForecastTimes(filter)
      if (!response) throw new Error('ForecastTimes response is undefined')

      selectedTimeZero.value = response.selectedTimeZero
      previousTimeZero.value = response.previousTimeZeros[0]
      nextTimeZero.value = response.nextTimeZeros[0]
      valid.value = response.valid
    } catch {
      error.value = 'Error loading forecastTimes'
      reset()
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadForecastTimes)

  return {
    selectedTimeZero,
    previousTimeZero,
    nextTimeZero,
    valid,
    isReady,
    isLoading,
    error,
  }
}
