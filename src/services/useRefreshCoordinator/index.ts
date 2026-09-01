import {
  useDocumentVisibility,
  useIntervalFn,
  type Fn,
  type Pausable,
  type UseIntervalFnOptions,
} from '@vueuse/core'
import { MaybeRefOrGetter, onUnmounted, ref, toValue, watch } from 'vue'

import { useSystemTimeStore } from '@/stores/systemTime'

export type RefreshPolicy =
  'onSystemTick' | 'onInterval' | 'onVisibilityResume' | 'manual'

interface UseRefreshCoordinatorOptions {
  policies: RefreshPolicy[]
  intervalMs?: MaybeRefOrGetter<number>
  intervalOptions?: UseIntervalFnOptions
  immediateCallback?: boolean
  enabled?: MaybeRefOrGetter<boolean>
}

export interface RefreshCoordinator extends Pausable {
  trigger: () => void
}

export function useRefreshCoordinator(
  callback: Fn,
  options: UseRefreshCoordinatorOptions,
): RefreshCoordinator {
  const visibility = useDocumentVisibility()
  const systemTimeStore = useSystemTimeStore()
  const policySet = new Set(options.policies)

  const isActive = ref<boolean>(true)
  const inFlight = ref<boolean>(false)
  const hasPending = ref<boolean>(false)

  let intervalPausable: Pausable | undefined

  async function invoke(): Promise<void> {
    if (!isActive.value) return
    if (!toValue(options.enabled ?? true)) return
    if (policySet.has('onVisibilityResume') && visibility.value !== 'visible') {
      return
    }

    if (inFlight.value) {
      hasPending.value = true
      return
    }

    inFlight.value = true
    try {
      await callback()
    } finally {
      inFlight.value = false
      if (hasPending.value) {
        hasPending.value = false
        void invoke()
      }
    }
  }

  const trigger = () => {
    void invoke()
  }

  const pause = () => {
    isActive.value = false
    intervalPausable?.pause()
  }

  const resume = () => {
    isActive.value = true
    intervalPausable?.resume()
  }

  if (policySet.has('onInterval')) {
    intervalPausable = useIntervalFn(
      trigger,
      options.intervalMs ?? 1000,
      options.intervalOptions,
    )
  }

  if (policySet.has('onVisibilityResume')) {
    watch(visibility, (value) => {
      if (value === 'visible') {
        trigger()
      }
    })
  }

  if (policySet.has('onSystemTick')) {
    watch(
      () => systemTimeStore.lastSyncedAt?.getTime(),
      (newValue, oldValue) => {
        if (newValue === undefined || newValue === oldValue) return
        trigger()
      },
    )
  }

  if (options.immediateCallback) {
    trigger()
  }

  onUnmounted(() => {
    pause()
  })

  return {
    isActive,
    pause,
    resume,
    trigger,
  }
}
