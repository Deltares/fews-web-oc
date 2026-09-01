import {
  type Fn,
  type Pausable,
} from '@vueuse/core'
import { type MaybeRefOrGetter } from 'vue'
import { useRefreshCoordinator } from '@/services/useRefreshCoordinator'

export function useFocusAwareInterval(
  callback: Fn,
  interval?: MaybeRefOrGetter<number>,
  options?: { immediateCallback?: boolean },
): Pausable {
  const coordinator = useRefreshCoordinator(callback, {
    policies: ['onInterval', 'onVisibilityResume'],
    intervalMs: interval,
    immediateCallback: options?.immediateCallback,
  })

  return {
    pause: coordinator.pause,
    resume: coordinator.resume,
    isActive: coordinator.isActive,
  }
}
