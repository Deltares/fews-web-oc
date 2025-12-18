import { inject, provide, ref } from 'vue'

const ELEVATION_KEY = Symbol('elevation')

export function provideSelectedElevation() {
  const sharedElevation = ref<number>(0)
  provide(ELEVATION_KEY, sharedElevation)
}

export function useSelectedElevation() {
  const fallbackElevation = ref<number>(0)
  return inject(ELEVATION_KEY, fallbackElevation)
}
