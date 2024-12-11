import { defineStore } from 'pinia'
import type { ColourMap, Style } from '@deltares/fews-wms-requests'
import { computed, MaybeRefOrGetter, reactive, ref, toValue, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchWmsLegend, useWmsLegend } from '@/services/useWms'
import {
  getLegendTitle,
  legendToRange,
  rangeToString,
  styleToId,
} from '@/lib/legend'

export interface Range {
  min: number
  max: number
}

export interface ColourScale {
  title: string
  style: Style
  range: Range
  initialRange: Range
  colourMap: ColourMap
  useGradients: boolean
}

const useColourScalesStore = defineStore('colourScales', () => {
  const scales = ref<Record<string, ColourScale>>({})
  const processingScaleIds = ref<string[]>([])

  async function addScale(
    style: Style,
    layerName: MaybeRefOrGetter<string>,
    title: MaybeRefOrGetter<string | undefined>,
    useDisplayUnits: MaybeRefOrGetter<boolean>,
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
      toValue(useDisplayUnits),
      undefined,
      style,
    )

    const legend = initialLegendGraphic.legend
    const newColourScale = reactive({
      title: getLegendTitle(toValue(title) ?? '', initialLegendGraphic),
      style: style,
      colourMap: legend,
      range: legendToRange(legend),
      initialRange: legendToRange(legend),
      useGradients: !legend.some((entry) => entry.colorSmoothing === false),
    })
    processingScaleIds.value = processingScaleIds.value.filter(
      (id) => id !== styleId,
    )
    scales.value[styleId] = newColourScale

    const range = computed(() => {
      const newRange = rangeToString(newColourScale.range)
      const initialRange = rangeToString(newColourScale.initialRange)

      return newRange !== initialRange ? newRange : undefined
    })

    const newLegendGraphic = useWmsLegend(
      baseUrl,
      layerName,
      useDisplayUnits,
      range,
      style,
      activeStyles,
    )

    watch(newLegendGraphic, () => {
      if (newLegendGraphic.value?.legend === undefined) return
      scales.value[styleId].title = getLegendTitle(
        toValue(title) ?? '',
        newLegendGraphic.value,
      )
      scales.value[styleId].colourMap = newLegendGraphic.value.legend
    })
  }
  return {
    scales,
    addScale,
  }
})

export { useColourScalesStore }
