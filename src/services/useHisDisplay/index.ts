import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { ref, shallowRef, watchEffect } from 'vue'

interface HisDisplaysResponse {
  hisDisplays?: HisDisplay[]
}

export interface HisDisplay {
  id: string
  relativeViewPeriod?: string
  filters?: string[]
  locationAttributes?: string[]
  toolboxes?: {
    resampling?: {
      show?: boolean
    }
    correlation?: {
      show?: boolean
    }
  }
}

export function useHisDisplay(baseUrl: string) {
  const hisDisplay = shallowRef<HisDisplay>()
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
      const url = provider.resourcesStaticUrl('his.json')
      const resp = await fetch(url)
      const response: HisDisplaysResponse = await resp.json()
      console.log('response', response)
      if (!response) throw new Error('HisDisplays response is undefined')

      hisDisplay.value = response.hisDisplays?.[0]
    } catch {
      error.value = 'Error loading HisDisplays'
      hisDisplay.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadHisDisplay)

  return {
    hisDisplay,
    isReady,
    isLoading,
    error,
  }
}
