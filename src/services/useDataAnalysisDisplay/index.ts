import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import {
  computed,
  MaybeRefOrGetter,
  ref,
  shallowRef,
  toValue,
  watchEffect,
} from 'vue'

interface DataAnalysisDisplaysResponse {
  dataAnalysisDisplays?: DataAnalysisDisplay[]
}

export interface DataAnalysisDisplayFilter {
  id: string
  name: string
}

export interface DataAnalysisDisplayLocationAttribute {
  id: string
  name: string
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
  filters?: DataAnalysisDisplayFilter[]
  locationAttributes?: DataAnalysisDisplayLocationAttribute[]
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

export function useDataAnalysisDisplay(
  baseUrl: string,
  dataAnalysisDisplayId: MaybeRefOrGetter<string | undefined>,
) {
  const dataAnalysisDisplays = shallowRef<DataAnalysisDisplay[]>()
  const dataAnalysisDisplay = computed(() => {
    const id = toValue(dataAnalysisDisplayId)
    return dataAnalysisDisplays.value?.find((display) => display.id === id)
  })
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadDataAnalyisDisplay() {
    isLoading.value = true
    isReady.value = false

    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const url = provider.resourcesStaticUrl('dataAnalysisDisplays.json')
      const resp = await fetch(url)
      const response: DataAnalysisDisplaysResponse = await resp.json()
      if (!response) {
        throw new Error('DataAnalysisDisplays response is undefined')
      }

      dataAnalysisDisplays.value = response.dataAnalysisDisplays
    } catch {
      error.value = 'Error loading DataAnalysisDisplays'
      dataAnalysisDisplays.value = []
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadDataAnalyisDisplay)

  return {
    dataAnalysisDisplay,
    dataAnalysisDisplays,
    isReady,
    isLoading,
    error,
  }
}
