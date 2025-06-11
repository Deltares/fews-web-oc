import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  PiWebserviceProvider,
  type CorrelationFilter,
  type CorrelationResponse,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const provider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export function useCorrelation(
  filter: MaybeRefOrGetter<CorrelationFilter | undefined>,
) {
  const correlation = shallowRef<CorrelationResponse>()
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadCorrelation() {
    const _filter = toValue(filter)
    if (_filter === undefined) {
      correlation.value = undefined
      return
    }

    isLoading.value = true
    try {
      correlation.value = await provider.getCorrelation(_filter)
    } catch {
      error.value = 'Error loading dashboards'
      correlation.value = undefined
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(loadCorrelation)

  return {
    correlation,
    isLoading,
    error,
  }
}
