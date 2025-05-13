import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { ref, shallowRef, watchEffect } from 'vue'

interface DataAnalysisDisplaysResponse {
  dataAnalysisDisplays?: DataAnalysisDisplay[]
}

export interface DataAnalysisDisplay {
  id: string
  relativeViewPeriod?: string
  archiveCoupling?: {
    enabled?: boolean
    metadata?: {
      properties?: Record<string, string>
      attributes?: Record<string, string>
    }
  }
  filters?: { id: string; name: string }[]
  locationAttributes?: { id: string; name: string }[]
  toolboxes?: {
    resampling?: { enabled?: boolean }
    correlation?: { enabled?: boolean }
    customToolboxes?: CustomToolbox[]
  }
}

interface CustomToolbox {
  id: string
  iconId: string
  name: string
  workflowId: string
  whatIfTemplateId: string
  output: {
    filterId: string
    archiveProductId: string
  }
}

export function useDataAnalysisDisplay(baseUrl: string) {
  const dataAnalysisDisplay = shallowRef<DataAnalysisDisplay>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadHisDisplay() {
    isLoading.value = true
    isReady.value = false

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const url = provider.resourcesStaticUrl('dataAnalysisDisplays.json')
      const resp = await fetch(url)
      const response: DataAnalysisDisplaysResponse = await resp.json()
      if (!response) throw new Error('HisDisplays response is undefined')

      dataAnalysisDisplay.value = response.dataAnalysisDisplays?.[0]
    } catch {
      error.value = 'Error loading HisDisplays'
      dataAnalysisDisplay.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadHisDisplay)

  return {
    dataAnalysisDisplay,
    isReady,
    isLoading,
    error,
  }
}
