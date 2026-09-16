import { useConfigStore } from '@/stores/config'
import { watch } from 'vue'

export function useCustomStyleSheet(options?: { onload: () => void }) {
  const id = 'custom-style-sheet'

  const configStore = useConfigStore()

  watch(
    () => configStore.general.customStyleSheet,
    async () => {
      let link = document.getElementById(id) as HTMLLinkElement | null

      if (link === null) {
        link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }

      link.href = await configStore.getCustomStyleSheet()
      if (options?.onload) {
        link.onload = options.onload
      }
    },
    { immediate: true },
  )
}
