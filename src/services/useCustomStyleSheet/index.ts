import { useConfigStore } from '@/stores/config'
import { watch } from 'vue'

export function useCustomStyleSheet(options?: { onload: () => void }) {
  const id = 'custom-style-sheet'

  const configStore = useConfigStore()

  watch(
    () => configStore.general,
    async () => {
      const css = document.getElementById('custom-style-sheet')
      if (css) return

      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = await configStore.getCustomStyleSheet()
      if (options?.onload) {
        link.onload = options.onload
      }
      document.head.appendChild(link)
    },
  )
}
