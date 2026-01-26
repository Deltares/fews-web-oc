import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { DocumentDisplay } from '@/lib/products'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const provider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export function useDocumentDisplay(
  displayId: MaybeRefOrGetter<string | undefined>,
) {
  const documentDisplay = shallowRef<DocumentDisplay>()
  const isLoading = ref(false)

  async function loadDocumentDisplay() {
    const _displayId = toValue(displayId)
    if (_displayId === undefined) {
      documentDisplay.value = undefined
      return
    }

    isLoading.value = true
    try {
      const response = await provider.getDocumentDisplays({
        displayId: _displayId,
      })
      documentDisplay.value = response.documentDisplays?.[0] as DocumentDisplay
    } catch {
      documentDisplay.value = undefined
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(loadDocumentDisplay)

  return {
    documentDisplay,
    isLoading,
  }
}
