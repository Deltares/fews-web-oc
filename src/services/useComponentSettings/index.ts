import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { getSettings } from '@/lib/topology/componentSettings'
import {
  type WebOCComponentSettingsClass,
  type ComponentSettingsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseComponentSettingsReturn {
  error: Ref<string | undefined>
  componentSettings: ShallowRef<WebOCComponentSettingsClass | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

const cache = new Map<
  string,
  Promise<WebOCComponentSettingsClass | undefined>
>()

export function useComponentSettings(
  baseUrl: string,
  componentSettingsIds: MaybeRefOrGetter<(string | undefined)[]>,
  parentComponentSettings?: MaybeRefOrGetter<
    WebOCComponentSettingsClass | undefined
  >,
): UseComponentSettingsReturn {
  const componentSettings = shallowRef<WebOCComponentSettingsClass>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadComponentSettings() {
    isLoading.value = true
    isReady.value = false

    const _componentSettingsIds = toValue(componentSettingsIds).filter(
      (id) => id !== undefined,
    )
    if (_componentSettingsIds.length === 0) {
      componentSettings.value = undefined
      return
    }
    const _parentComponentSettings = toValue(parentComponentSettings)
    const provider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

    try {
      // Get unique IDs
      const uniqueIds = Array.from(new Set(_componentSettingsIds))

      // Fetch component settings for unique IDs
      const fetchComponentSettings = async (id: string) => {
        if (cache.has(id)) {
          return cache.get(id)
        }
        const promise = (async () => {
          const filter: ComponentSettingsFilter = {
            componentSettingsId: id,
          }
          const response = await provider.getComponentSettings(filter)
          return response.webOCComponentSettings
        })()
        cache.set(id, promise)
        return promise
      }

      await Promise.all(uniqueIds.map(fetchComponentSettings))

      // Use the full array of IDs to preserve order
      const responses = await Promise.all(
        _componentSettingsIds.map((id) => cache.get(id)),
      )

      componentSettings.value = getSettings([
        _parentComponentSettings,
        ...responses,
      ])
    } catch {
      error.value = 'Error loading componentSettings'
      componentSettings.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadComponentSettings)

  return {
    componentSettings,
    isReady,
    isLoading,
    error,
  }
}
