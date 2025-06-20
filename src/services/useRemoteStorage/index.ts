import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { Serializer, useStorage, watchDebounced } from '@vueuse/core'
import { ref, onMounted, Ref } from 'vue'
import { configManager } from '@/services/application-config'
import { getJsonSerializer } from '@/lib/analysis'

export interface UseRemoteStorageOptions<T> {
  debounce?: number
  serializer?: Serializer<T>
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const piProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export function useRemoteStorage<T>(
  key: string,
  defaultValue: T,
  options: UseRemoteStorageOptions<T>,
) {
  const { debounce = 1000, serializer = getJsonSerializer<T>() } = options

  // Use local storage if we have no user
  if (!configManager.authenticationIsEnabled) {
    return {
      state: useStorage(key, defaultValue, undefined, {
        serializer,
      }),
    }
  }

  const state = ref<T | null>(null) as Ref<T | null>

  const parser = {
    parse: async (response: Response): Promise<T> => {
      const text = await response.text()
      return serializer.read(text)
    },
  }

  // TODO: We now only get on mounted
  // This could lead to issues when multiple / stale tabs are open

  // Load from server on mount
  onMounted(async () => {
    try {
      const response = await piProvider.getUserSettings<T>(
        {
          topicId: key,
        },
        parser,
      )
      state.value = response
    } catch (e) {
      if (e instanceof Error && e.cause instanceof Response) {
        const body = await e.cause.text()
        if (body.includes('No user settings found for this user and topic.')) {
          // If no settings found, initialize with default value
          state.value = defaultValue
        }
        console.error(`Remote load failed: ${body}`, e)
      } else {
        console.error('Remote load failed', e)
      }
    }
  })

  // Save to server on change (debounced)
  watchDebounced(
    state,
    async (newValue) => {
      if (newValue === null) return

      const body = serializer.write(newValue)
      try {
        await piProvider.postUserSettings(
          {
            topicId: key,
          },
          body,
        )
      } catch (e) {
        console.error('Remote save failed', e)
      }
    },
    { debounce, deep: true },
  )

  return { state }
}
