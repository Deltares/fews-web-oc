import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  PiWebserviceProvider,
  type TopologyThresholdNode,
} from '@deltares/fews-pi-requests'
import { type Pausable } from '@vueuse/core'
import type { Ref, ShallowRef } from 'vue'
import { ref, shallowRef } from 'vue'
import { useFocusAwareInterval } from '../useFocusAwareInterval'

export interface UseTopologyThresholdsReturn {
  error: Ref<string | undefined>
  thresholds: ShallowRef<TopologyThresholdNode[] | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  interval: Pausable
}

const THRESHOLDS_POLLING_INTERVAL = 1000 * 30

export function useTopologyThresholds(
  baseUrl: string,
): UseTopologyThresholdsReturn {
  const thresholds = shallowRef<TopologyThresholdNode[]>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadTopologyThresholds() {
    isLoading.value = true
    isReady.value = false
    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await provider.getTopologyThresholds({})
      thresholds.value = response.topologyNodes
    } catch {
      error.value = 'Error loading topology thresholds'
      thresholds.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  const interval = useFocusAwareInterval(
    loadTopologyThresholds,
    THRESHOLDS_POLLING_INTERVAL,
  )

  return {
    thresholds,
    isReady,
    isLoading,
    error,
    interval,
  }
}
