import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'

export const useDownloadDisclaimerStore = defineStore(
  'downloadDisclaimer',
  () => {
    const url = getResourcesStaticUrl('data-usage-agreement.txt')

    const isVisible = ref(false)
    const hasAccepted = ref(false)
    const isConfigured = ref<boolean | null>(null)

    const text = ref<string>()
    const error = ref<string>()
    const isLoading = ref(false)

    let resolveRequest: ((accepted: boolean) => void) | null = null
    let fetchDisclaimerPromise: Promise<void> | null = null

    /**
     * Fetches the download disclaimer text, if configured. Populates
     * `isConfigured` and, when available, `text` (or `error` on failure).
     * The result is cached for the lifetime of the store, so the resource is
     * only requested once per session.
     */
    function fetchDisclaimer(): Promise<void> {
      if (!fetchDisclaimerPromise) {
        const load = async (): Promise<void> => {
          isLoading.value = true
          try {
            const response = await fetch(url)
            if (response.status === 404) {
              isConfigured.value = false
              return
            }
            isConfigured.value = true
            if (!response.ok) {
              error.value = `Failed to load disclaimer: ${response.status} ${response.statusText}`
              return
            }
            text.value = await response.text()
          } catch (e) {
            console.error('Error fetching disclaimer:', e)
            isConfigured.value = true
            error.value = 'Failed to load disclaimer.'
          } finally {
            isLoading.value = false
          }
        }
        fetchDisclaimerPromise = load()
      }
      return fetchDisclaimerPromise
    }

    /**
     * Ensures that a configured disclaimer has been shown to the user at
     * least once before a download dialog is opened. Does nothing when no
     * disclaimer is configured, or when the user already accepted it in a
     * previous session. Does not throw or block the caller when the user
     * declines; callers should inspect `hasAccepted` afterwards if needed.
     */
    async function ensureShown(): Promise<void> {
      await fetchDisclaimer()
      if (!isConfigured.value || hasAccepted.value) return
      await showDisclaimer()
    }

    /**
     * Shows the disclaimer dialog and resolves once the user accepts or
     * declines it.
     */
    function showDisclaimer(): Promise<boolean> {
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
      hasAccepted.value = false
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
      isConfigured,
      url,
      text,
      error,
      isLoading,
      ensureShown,
      showDisclaimer,
      accept,
      decline,
    }
  },
  {
    persist: {
      key: 'weboc-download-disclaimer-v1.0.0',
      storage: window.localStorage,
      pick: ['hasAccepted'],
    },
  },
)
