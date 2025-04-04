import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  PiWebserviceProvider,
  type WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export const useAvailableWhatIfTemplatesStore = defineStore(
  'availableWhatIfTemplates',
  () => {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

    const whatIfTemplates = ref<WhatIfTemplate[]>([])
    const isLoading = ref(false)

    function byId(
      whatIfTemplateId: string | undefined,
    ): WhatIfTemplate | undefined {
      return whatIfTemplates.value.find(
        (template) => template.id === whatIfTemplateId,
      )
    }

    async function fetch() {
      isLoading.value = true
      try {
        const response = await piProvider.getWhatIfTemplates({})
        whatIfTemplates.value = response.whatIfTemplates
      } catch (error) {
        console.error('Failed to fetch available whatIfTemplates.', error)
      } finally {
        isLoading.value = false
      }
    }

    fetch()

    return {
      whatIfTemplates,
      isLoading,
      byId,
      fetch,
    }
  },
)
