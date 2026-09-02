import { defineStore } from 'pinia'
import type { ColourMap, Style } from '@deltares/fews-wms-requests'
import { MaybeRefOrGetter, reactive, ref, toValue, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchWmsLegend, useWmsLegend } from '@/services/useWms'
import { legendToRange, rangeToString, styleToId } from '@/lib/legend'

export interface Range {
  min: number
  max: number
}

export interface ColourScale {
  id: string
  style: Style
  range: Range
  initialRange: string
  requestRange?: string
  colourMap: ColourMap
  useGradients: boolean
  unit?: string
}

const useColourScalesStore = defineStore('colourScales', () => {
  const scales = ref<Record<string, ColourScale>>({})
  const processingScaleIds = ref<string[]>([])

  function clearScales() {
    scales.value = {}
    processingScaleIds.value = []
  }

  async function addScale(
    style: Style,
    layerName: MaybeRefOrGetter<string>,
    useDisplayUnits: boolean,
    activeStyles: MaybeRefOrGetter<Style[]>,
  ) {
    const styleId = styleToId(style)
    if (styleId in scales.value || processingScaleIds.value.includes(styleId)) {
      return
    }

    processingScaleIds.value.push(styleId)

    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

    const initialLegendGraphic = await fetchWmsLegend(
      baseUrl,
      toValue(layerName),
      useDisplayUnits,
      undefined,
      style,
    )

    const legend = initialLegendGraphic.legend
    const newColourScale = reactive<ColourScale>({
      id: styleId,
      unit: initialLegendGraphic.unit,
      style: style,
      colourMap: legend,
      range: legendToRange(legend),
      initialRange: rangeToString(legendToRange(legend)),
      requestRange: undefined,
      useGradients: !legend.some((entry) => entry.colorSmoothing === false),
    })
    processingScaleIds.value = processingScaleIds.value.filter(
      (id) => id !== styleId,
    )
    scales.value[styleId] = newColourScale

    watch(
      () => rangeToString(newColourScale.range),
      (newRange) => {
        const isInitialRange = newRange === newColourScale.initialRange
        const requestRange = isInitialRange ? undefined : newRange
        newColourScale.requestRange = requestRange
      },
    )

    const newLegendGraphic = useWmsLegend(
      baseUrl,
      layerName,
      useDisplayUnits,
      () => newColourScale.requestRange,
      style,
      activeStyles,
    )

    watch(newLegendGraphic, () => {
      if (newLegendGraphic.value?.legend === undefined) return
      newColourScale.colourMap = newLegendGraphic.value.legend
    })
  }
  return {
    scales,
    addScale,
    clearScales,
  }
})

export { useColourScalesStore }
