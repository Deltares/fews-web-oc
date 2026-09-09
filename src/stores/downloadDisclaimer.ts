import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'

export const useDownloadDisclaimerStore = defineStore(
  'downloadDisclaimer',
  () => {
    const url = getResourcesStaticUrl('download-disclaimer.txt')

    const isVisible = ref(false)
    const hasAccepted = ref(false)

    const text = ref<string>()
    const error = ref<string>()
    const isLoading = ref(false)

    let resolveRequest: ((accepted: boolean) => void) | null = null
    let fetchDisclaimerPromise: Promise<boolean> | null = null

    /**
     * Fetches the download disclaimer text, if configured. Resolves to true
     * when a disclaimer is available (and populates `text`), or false when
     * no disclaimer is configured or it could not be loaded (and populates
     * `error`). The result is cached for the lifetime of the store, so the
     * resource is only requested once per session.
     */
    function fetchDisclaimer(): Promise<boolean> {
      if (!fetchDisclaimerPromise) {
        const load = async (): Promise<boolean> => {
          isLoading.value = true
          try {
            const response = await fetch(url)
            if (response.status === 404) return false
            if (!response.ok) {
              error.value = `Failed to load disclaimer: ${response.status} ${response.statusText}`
              return true
            }
            text.value = await response.text()
            return true
          } catch (e) {
            console.error('Error fetching disclaimer:', e)
            error.value = 'Failed to load disclaimer.'
            return true
          } finally {
            isLoading.value = false
          }
        }
        fetchDisclaimerPromise = load()
      }
      return fetchDisclaimerPromise
    }

    /**
     * Asks the user to accept the download disclaimer.
     *
     * The disclaimer only has to be accepted once per session. Resolves to true
     * when the user accepts, when it was already accepted this session, or when
     * no disclaimer is configured. Resolves to false when the user declines, in
     * which case the download should be aborted.
     */
    async function requestAcceptance(): Promise<boolean> {
      if (hasAccepted.value) return true

      const shouldShowDialog = await fetchDisclaimer()
      if (!shouldShowDialog) {
        hasAccepted.value = true
        return true
      }

      isVisible.value = true

      return new Promise<boolean>((resolve) => {
        // Abort any pending request, so it cannot be resolved by this dialog.
        resolveRequest?.(false)
        resolveRequest = resolve
      })
    }

    function accept(): void {
      hasAccepted.value = true
      resolve(true)
    }

    function decline(): void {
      resolve(false)
    }

    function resolve(accepted: boolean): void {
      isVisible.value = false
      resolveRequest?.(accepted)
      resolveRequest = null
    }

    return {
      isVisible,
      hasAccepted,
      url,
      text,
      error,
      isLoading,
      requestAcceptance,
      accept,
      decline,
    }
  },
)
