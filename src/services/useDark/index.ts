import { computed } from 'vue'
import { useTheme } from 'vuetify'

export function useDark() {
  const { current } = useTheme()
  const isDark = computed(() => current.value.dark)

  return isDark
}
