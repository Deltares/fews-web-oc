import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { getSettings } from '@/lib/topology/componentSettings'
import {
  type WebOCComponentSettings,
  type ComponentSettingsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseComponentSettingsReturn {
  error: Ref<string | undefined>
  componentSettings: ShallowRef<WebOCComponentSettings | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useComponentSettings(
  baseUrl: string,
  componentSettingsId: MaybeRefOrGetter<string | undefined>,
  parentComponentSettings?: MaybeRefOrGetter<
    WebOCComponentSettings | undefined
  >,
): UseComponentSettingsReturn {
  const componentSettings = shallowRef<WebOCComponentSettings>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadComponentSettings() {
    isLoading.value = true
    isReady.value = false

    try {
      const _componentSettingsId = toValue(componentSettingsId)
      if (_componentSettingsId === undefined) {
        componentSettings.value = undefined
        return
      }
      const _parentComponentSettings = toValue(parentComponentSettings)
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: ComponentSettingsFilter = {
        componentSettingsId: _componentSettingsId,
      }
      const response = await provider.getComponentSettings(filter)
      if (!response) throw new Error('ComponentSettings response is undefined')

      componentSettings.value = getSettings(
        response.webOCComponentSettings,
        _parentComponentSettings,
      )
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
