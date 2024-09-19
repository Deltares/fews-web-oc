import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  LocationsTooltipFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseLocationTooltipReturn {
  error: Ref<string | undefined>
  tooltip: ShallowRef<string | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useLocationTooltip(
  baseUrl: string,
  filter: MaybeRefOrGetter<LocationsTooltipFilter | undefined>,
): UseLocationTooltipReturn {
  const tooltip = shallowRef<string>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadLocationTooltip() {
    isLoading.value = true
    isReady.value = false

    try {
      const _filter = toValue(filter)
      if (!_filter) throw new Error('Tooltip filter is undefined')

      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await provider.getLocationsTooltip(_filter)
      if (!response) throw new Error('Tooltip response is undefined')

      tooltip.value = isHTML(response) ? response : formatAsHTML(response)
    } catch {
      error.value = 'Error loading location tooltip'
      tooltip.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadLocationTooltip)

  return {
    tooltip,
    isReady,
    isLoading,
    error,
  }
}

function isHTML(str: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1)
}

function formatAsHTML(str: string) {
  return `<pre>${str}</pre>`
}
