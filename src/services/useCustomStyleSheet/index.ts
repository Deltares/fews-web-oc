import { useConfigStore } from '@/stores/config'
import { watch } from 'vue'

const id = 'custom-style-sheet'
let loadingStyleSheet: Promise<void> | undefined

export function loadCustomStyleSheet(): Promise<void> {
  const configStore = useConfigStore()
  const existingStyleSheet = document.getElementById(id)

  if (loadingStyleSheet) return loadingStyleSheet
  if (existingStyleSheet instanceof HTMLLinkElement) {
    if (existingStyleSheet.sheet) return Promise.resolve()
    return waitForStyleSheet(existingStyleSheet)
  }

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  loadingStyleSheet = (async () => {
    link.href = await configStore.getCustomStyleSheet()
    const styleSheetLoaded = waitForStyleSheet(link)
    document.head.appendChild(link)
    await styleSheetLoaded
  })()

  return loadingStyleSheet
}

function waitForStyleSheet(link: HTMLLinkElement): Promise<void> {
  return new Promise((resolve) => {
    link.addEventListener('load', () => resolve(), { once: true })
    link.addEventListener(
      'error',
      (event) => {
        console.error(`Failed to load stylesheet: ${link.href}`, event)
        resolve()
      },
      { once: true },
    )
  })
}

export function useCustomStyleSheet(options?: { onload: () => void }) {
  const configStore = useConfigStore()

  watch(
    () => configStore.general,
    async () => {
      await configStore.setFewsConfig()
      await loadCustomStyleSheet()
      options?.onload()
    },
    { immediate: true },
  )
}
