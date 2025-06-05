import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DataAnalysisDisplayElement,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { MaybeRefOrGetter, ref, shallowRef, toValue, watchEffect } from 'vue'

export function useDataAnalysisDisplay(
  baseUrl: string,
  dataAnalysisDisplayId: MaybeRefOrGetter<string | undefined>,
) {
  const dataAnalysisDisplay = ref<DataAnalysisDisplayElement>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadDataAnalyisDisplay() {
    isLoading.value = true
    isReady.value = false

    const _dataAnalysisDisplayId = toValue(dataAnalysisDisplayId)

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await provider.getDataAnalysisDisplays({
        dataAnalysisDisplayId: _dataAnalysisDisplayId,
      })
      dataAnalysisDisplay.value = response.dataAnalysisDisplays?.[0]
    } catch {
      error.value = 'Error loading DataAnalysisDisplay'
      dataAnalysisDisplay.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadDataAnalyisDisplay)

  return {
    dataAnalysisDisplay,
    isReady,
    isLoading,
    error,
  }
}
