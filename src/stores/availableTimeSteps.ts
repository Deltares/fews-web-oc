import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  PiWebserviceProvider,
  type TimeSteps,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export const useAvailableTimeStepsStore = defineStore(
  'availableTimeSteps',
  () => {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

    const resamplingTimeSteps = ref<TimeSteps[]>([])
    const isLoading = ref(false)

    async function fetch() {
      isLoading.value = true
      try {
        const response = await piProvider.getTimeSteps({
          // @ts-expect-error: FIXME: fix type in the library
          onlyResampling: true,
        })
        const timesteps = response.timeSteps ?? []
        resamplingTimeSteps.value = timesteps.toSorted((a, b) =>
          a.id.localeCompare(b.id),
        )
      } catch (error) {
        console.error('Failed to fetch available timesteps.', error)
      } finally {
        isLoading.value = false
      }
    }

    fetch()

    return {
      resamplingTimeSteps,
      isLoading,
      fetch,
    }
  },
)
