import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTaskRunColorsStore = defineStore('taskRunColors', () => {
  const colorMap = ref<Map<string, string>>(new Map())
  const colors = ref<string[]>([])
  const currentColors = ref<string[]>([])

  function setColor(taskRunId: string) {
    // pop the first color from the currentColors array and set it to the colorMap
    colorMap.value.set(taskRunId, currentColors.value.pop() ?? '')
  }

  function getColor(taskRunId: string): undefined | string {
    return colorMap.value.get(taskRunId)
  }

  function clearColors() {
    colorMap.value.clear()
    currentColors.value = [...colors.value]
  }

  function setColorMap(newMap: Map<string, string>) {
    colorMap.value = newMap
  }

  function setColors(baseUrl: string) {
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

  return {
    colorMap,
    setColor,
    setColors,
    getColor,
    clearColors,
    setColorMap,
  }
})
