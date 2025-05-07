import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DocumentFormat,
  PiWebserviceProvider,
  type TimeSeriesParameter,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export const useParametersStore = defineStore('parameters', () => {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const parameters = ref<TimeSeriesParameter[]>([])
  const isLoading = ref(false)

  function byId(
    parameterId: string | undefined,
  ): TimeSeriesParameter | undefined {
    return parameters.value.find((parameter) => parameter.id === parameterId)
  }

  function getName(parameterId: string | undefined): string {
    const parameter = byId(parameterId)
    return parameter?.name ?? parameter?.shortName ?? parameterId ?? 'Unknown'
  }

  async function fetch() {
    isLoading.value = true
    try {
      const response = await piProvider.getParameters({
        documentFormat: DocumentFormat.PI_JSON,
      })
      parameters.value = response.timeSeriesParameters
    } catch (error) {
      console.error('Failed to fetch available parameters.', error)
    } finally {
      isLoading.value = false
    }
  }

  fetch()

  return {
    parameters,
    isLoading,
    byId,
    getName,
    fetch,
  }
})
