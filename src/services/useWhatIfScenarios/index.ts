import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type WhatIfScenarioDescriptor,
  type WhatIfScenariosFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseWhatIfScenarioReturn {
  error: Ref<string | undefined>
  whatIfScenarios: ShallowRef<WhatIfScenarioDescriptor[]>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useWhatIfScenarios(
  baseUrl: string,
  whatIfTemplateId?: MaybeRefOrGetter<string | undefined>,
): UseWhatIfScenarioReturn {
  const whatIfScenarios = shallowRef<WhatIfScenarioDescriptor[]>([])
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadWhatIfScenario() {
    isLoading.value = true
    isReady.value = false

    try {
      const _whatIfTemplateId = toValue(whatIfTemplateId)
      if (_whatIfTemplateId === undefined) {
        whatIfScenarios.value = []
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: WhatIfScenariosFilter = {
        whatIfTemplateId: _whatIfTemplateId,
      }
      const response = await provider.getWhatIfScenarios(filter)
      if (!response) throw new Error('WhatIfScenarios response is undefined')

      whatIfScenarios.value = response.whatIfScenarioDescriptors
    } catch {
      error.value = 'Error loading whatIfScenarios'
      whatIfScenarios.value = []
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadWhatIfScenario)

  return {
    whatIfScenarios,
    isReady,
    isLoading,
    error,
  }
}
