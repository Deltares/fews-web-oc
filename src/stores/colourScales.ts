import { defineStore } from 'pinia'
import type {
  ColourMap,
  GetLegendGraphicResponse,
  Style,
} from '@deltares/fews-wms-requests'
import { computed, MaybeRefOrGetter, reactive, ref, toValue, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchWmsLegend, useWmsLegend } from '@/services/useWms'
import { legendToRange, rangeToString, styleToId } from '@/lib/legend'

export interface Range {
  min: number
  max: number
}

export interface ColourScale {
  id: string
  title: string
  style?: string
  range: Range
  initialRange: Range
  colourMap: ColourMap
  useGradients: boolean
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
    const newColourScale = reactive({
      id: styleId,
      title: getScaleTitle(initialLegendGraphic, style),
      style: style.name,
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
      scales.value[styleId].colourMap = newLegendGraphic.value.legend
    })
  }
  return {
    scales,
    addScale,
    clearScales,
  }
})

export { useColourScalesStore }

function getScaleTitle(
  response: GetLegendGraphicResponse,
  style: Style,
): string {
  // @ts-expect-error: title has not yet been added to response
  const title = response.title ?? style.title
  const unitString = response.unit ? ` [${response.unit}]` : ''
  return `${title}${unitString}`
}
