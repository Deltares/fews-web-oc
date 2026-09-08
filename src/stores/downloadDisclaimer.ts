import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDownloadDisclaimerStore = defineStore(
  'downloadDisclaimer',
  () => {
    const isVisible = ref(false)
    const hasAccepted = ref(false)

    let resolveRequest: ((accepted: boolean) => void) | null = null

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
      requestAcceptance,
      accept,
      decline,
    }
  },
)
