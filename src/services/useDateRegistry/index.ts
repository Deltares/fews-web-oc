import { getCombinedDates, getSortedDates } from '@/lib/utils/dates'
import {
  computed,
  provide,
  inject,
  onMounted,
  onUnmounted,
  type InjectionKey,
  toValue,
  type MaybeRefOrGetter,
  ref,
} from 'vue'

type DateRefOrGetter = MaybeRefOrGetter<Date[]>

interface DateRegistry {
  registerDates: (ref: DateRefOrGetter) => void
  unregisterDates: (ref: DateRefOrGetter) => void
}

const DATE_REGISTRY_KEY: InjectionKey<DateRegistry> = Symbol('DateRegistry')

/**
 * Creates a registry for managing `Date[]` refs.
 * @returns An object containing the combined dates as a computed property.
 */
export function createDateRegistry() {
  const dateRefs = ref<DateRefOrGetter[]>([])

  const registerDates = (ref: DateRefOrGetter) => {
    dateRefs.value.push(ref)
  }

  const unregisterDates = (ref: DateRefOrGetter) => {
    const index = dateRefs.value.indexOf(ref)
    if (index > -1) {
      dateRefs.value.splice(index, 1)
    }
  }

  const combinedDates = computed(() => {
    const dates = dateRefs.value.flatMap((ref) => toValue(ref))
    const combinedDates = getCombinedDates(dates)
    return getSortedDates(combinedDates)
  })

  provide(DATE_REGISTRY_KEY, { registerDates, unregisterDates })

  return { combinedDates }
}

/**
 * Uses the registry and automatically manages lifecycle registration/unregistration.
 * @param dates The reactive ref containing `Date[]` to be registered.
 */
export function useDateRegistry(dates: DateRefOrGetter) {
  const registry = inject(DATE_REGISTRY_KEY, undefined)
  if (!registry) return

  onMounted(() => {
    registry.registerDates(dates)
  })

  onUnmounted(() => {
    registry.unregisterDates(dates)
  })
}
