import { defineStore } from 'pinia'
import type { ColourMap, Style } from '@deltares/fews-wms-requests'
import {
  effectScope,
  EffectScope,
  MaybeRefOrGetter,
  reactive,
  ref,
  toValue,
  watch,
  watchEffect,
} from 'vue'
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
  initialRange: Range
  requestRange?: string
  isInitialRange: boolean
  colourMap: ColourMap
  useGradients: boolean
  unit?: string
}

const useColourScalesStore = defineStore('colourScales', () => {
  const scales = ref<Record<string, ColourScale>>({})
  const processingScaleIds = ref<string[]>([])
  // Each scale owns background watchers (legend polling, derived range state).
  // Track their effect scopes so they can be stopped when a scale is removed,
  // instead of leaking indefinitely.
  const scopes = new Map<string, EffectScope>()

  function stopScope(styleId: string) {
    scopes.get(styleId)?.stop()
    scopes.delete(styleId)
  }

  function removeScale(styleId: string) {
    stopScope(styleId)
    const { [styleId]: _removed, ...rest } = scales.value
    scales.value = rest
  }

  function clearScales() {
    for (const styleId of scopes.keys()) {
      stopScope(styleId)
    }
    scales.value = {}
    processingScaleIds.value = []
  }

  function setRange(styleId: string, range: Range) {
    const scale = scales.value[styleId]
    if (!scale) return
    scale.range = range
  }

  function resetRange(styleId: string) {
    const scale = scales.value[styleId]
    if (!scale) return
    scale.range = { ...scale.initialRange }
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

    let initialLegendGraphic
    try {
      initialLegendGraphic = await fetchWmsLegend(
        baseUrl,
        toValue(layerName),
        useDisplayUnits,
        undefined,
        style,
      )
    } catch (error) {
      console.error(`Failed to fetch legend for style "${styleId}":`, error)
      return
    } finally {
      processingScaleIds.value = processingScaleIds.value.filter(
        (id) => id !== styleId,
      )
    }

    const legend = initialLegendGraphic.legend
    const scale = reactive<ColourScale>({
      id: styleId,
      unit: initialLegendGraphic.unit,
      style: style,
      colourMap: legend,
      range: legendToRange(legend),
      initialRange: legendToRange(legend),
      isInitialRange: true,
      requestRange: undefined,
      useGradients: !legend.some((entry) => entry.colorSmoothing === false),
    })
    scales.value[styleId] = scale

    // Run this scale's watchers in their own scope so they can be disposed
    // together when the scale is removed or the store is cleared.
    const scope = effectScope()
    scopes.set(styleId, scope)

    scope.run(() => {
      watchEffect(() => {
        scale.isInitialRange =
          scale.range.min === scale.initialRange.min &&
          scale.range.max === scale.initialRange.max

        scale.requestRange = scale.isInitialRange
          ? undefined
          : rangeToString(scale.range)
      })

      const newLegendGraphic = useWmsLegend(
        baseUrl,
        layerName,
        useDisplayUnits,
        () => scale.requestRange,
        style,
        activeStyles,
      )

      watch(newLegendGraphic, () => {
        if (newLegendGraphic.value?.legend === undefined) return
        scale.colourMap = newLegendGraphic.value.legend
      })
    })
  }

  return {
    scales,
    addScale,
    removeScale,
    clearScales,
    setRange,
    resetRange,
  }
})

export { useColourScalesStore }
