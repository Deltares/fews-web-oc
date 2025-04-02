import {
  MaybeRefOrGetter,
  onBeforeUnmount,
  ref,
  shallowRef,
  toValue,
  watch,
} from 'vue'

export function useDynamicCss(url: MaybeRefOrGetter<string>) {
  const hasLoadedCss = ref(false)
  const link = shallowRef<HTMLLinkElement | null>(null)

  function addCss(_url: string) {
    link.value = document.createElement('link')
    link.value.rel = 'stylesheet'
    link.value.href = _url
    link.value.onload = () => {
      hasLoadedCss.value = true
    }
    document.head.appendChild(link.value)
  }

  function removeCss() {
    if (link.value) {
      link.value.remove()
      link.value = null
      hasLoadedCss.value = false
    }
  }

  watch(
    () => toValue(url),
    (newUrl) => {
      if (!link.value) {
        addCss(newUrl)
      } else if (link.value.href !== newUrl) {
        removeCss()
        addCss(newUrl)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    removeCss()
  })

  return {
    hasLoadedCss,
  }
}
