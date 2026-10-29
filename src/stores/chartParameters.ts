import { computed, shallowReactive } from 'vue'
import { defineStore } from 'pinia'

export const useChartParametersStore = defineStore('chartParameters', () => {
  const displays = shallowReactive(new Map<symbol, string[]>())
  const parameterIds = computed(() => [
    ...new Set([...displays.values()].flat()),
  ])

  function setParameterIds(display: symbol, ids: string[]) {
    displays.set(display, ids)
  }

  function removeParameterIds(display: symbol) {
    displays.delete(display)
  }

  return { parameterIds, setParameterIds, removeParameterIds }
})
