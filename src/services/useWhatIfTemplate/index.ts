import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type WhatIfTemplate,
  type WhatIfTemplatesFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { computed, ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseWhatIfTemplateReturn {
  error: Ref<string | undefined>
  whatIfTemplates: ShallowRef<WhatIfTemplate[]>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useWhatIfTemplate(
  baseUrl: string,
  whatIfTemplateId?: MaybeRefOrGetter<string | undefined>,
) {
  const { whatIfTemplates, ...rest } = useWhatIfTemplates(baseUrl, () => {
    const _whatIfTemplateId = toValue(whatIfTemplateId)
    return _whatIfTemplateId ? [_whatIfTemplateId] : []
  })

  const whatIfTemplate = computed(() => whatIfTemplates.value[0])

  return {
    whatIfTemplate,
    ...rest,
  }
}

export function useWhatIfTemplates(
  baseUrl: string,
  whatIfTemplateIds: MaybeRefOrGetter<string[]>,
): UseWhatIfTemplateReturn {
  const whatIfTemplates = shallowRef<WhatIfTemplate[]>([])
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadWhatIfTemplate() {
    isLoading.value = true
    isReady.value = false

    try {
      const _whatIfTemplateIds = toValue(whatIfTemplateIds)
      if (!_whatIfTemplateIds.length) {
        whatIfTemplates.value = []
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const fetchWhatIfTemplate = async (whatIfTemplateId: string) => {
        const filter: WhatIfTemplatesFilter = {
          whatIfTemplateId,
        }
        const response = await provider.getWhatIfTemplates(filter)
        if (!response) throw new Error('WhatIfTemplates response is undefined')

        return response.whatIfTemplates?.[0]
      }

      const promises = _whatIfTemplateIds.map(fetchWhatIfTemplate)
      whatIfTemplates.value = await Promise.all(promises)
    } catch {
      error.value = 'Error loading whatIfTemplates'
      whatIfTemplates.value = []
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadWhatIfTemplate)

  return {
    whatIfTemplates,
    isReady,
    isLoading,
    error,
  }
}
