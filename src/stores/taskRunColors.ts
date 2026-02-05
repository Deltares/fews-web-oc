import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTaskRunColorsStore = defineStore('taskRunColors', () => {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const colorMap = ref<Map<string, string>>(new Map())
  const colors = ref<string[]>([])
  const currentColors = ref<string[]>([])

  function assignColor(taskRunId: string) {
    // pop the first color from the currentColors array and set it to the colorMap
    colorMap.value.set(taskRunId, currentColors.value.pop() ?? '')
  }

  function getColor(taskRunId: string): undefined | string {
    return colorMap.value.get(taskRunId)
  }

  function hasColor(taskRunId: string): boolean {
    return colorMap.value.has(taskRunId)
  }

  function clearColors() {
    colorMap.value.clear()
    currentColors.value = [...colors.value]
  }

  function setColorMap(newMap: Map<string, string>) {
    colorMap.value = newMap
  }

  function fetchColors() {
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })
    piProvider.getColors().then((response) => {
      if (response.colors) {
        colors.value = [...response.colors.map((color) => color.color)]
        clearColors()
      }
    })
  }

  fetchColors()

  return {
    colors,
    colorMap,
    assignColor,
    fetchColors,
    getColor,
    hasColor,
    clearColors,
    setColorMap,
  }
})
