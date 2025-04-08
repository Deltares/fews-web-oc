import {
  useIntervalFn,
  useDocumentVisibility,
  type Fn,
  type UseIntervalFnOptions,
} from '@vueuse/core'
import { type MaybeRefOrGetter, ref, watch } from 'vue'

export function useFocusAwareInterval(
  callback: Fn,
  interval?: MaybeRefOrGetter<number>,
  options?: UseIntervalFnOptions,
) {
  const visibility = useDocumentVisibility()

  const pausable = useIntervalFn(callback, interval, options)
  const { pause, resume, isActive } = pausable

  const pausedByVisibility = ref(false)
  watch(visibility, (v) => {
    if (v === 'visible') {
      if (pausedByVisibility.value) {
        resume()
        pausedByVisibility.value = false
      }
    } else {
      if (isActive.value) {
        pause()
        pausedByVisibility.value = true
      }
    }
  })

  return pausable
}
