import type { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import { toValue, watch, type MaybeRefOrGetter } from 'vue'

import { getResourcesStaticUrl } from '@/lib/fews-config'

export function usePageMetadata(general: MaybeRefOrGetter<WebOcGeneralConfig>) {
  watch(
    () => toValue(general).title,
    (title, oldTitle) => {
      if (title === undefined && oldTitle === undefined) return
      document.title = title ?? 'Delft-FEWS Web OC'
    },
    { immediate: true },
  )

  watch(
    () => toValue(general).icons,
    (icons) => {
      if (icons?.favicon) {
        const faviconUrl = getResourcesStaticUrl(icons.favicon).toString()
        const currentFavicon = document.querySelector("link[rel='icon']")
        currentFavicon?.setAttribute('href', faviconUrl)
      }
    },
    { immediate: true },
  )
}
