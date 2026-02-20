<template>
  <div
    class="chart-with-chips"
    :class="{ 'vertical-profile': verticalProfile }"
    :style="{
      'flex-direction': settings.legend.placement.includes('under')
        ? 'column-reverse'
        : 'column',
    }"
  >
    <ChartLegend
      :tags="legendTags"
      :margin="margin"
      :settings="settings.legend"
      @toggle-line="toggleLine"
    />
    <div ref="chartContainer" class="chart-container"></div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  useTemplateRef,
} from 'vue'
import {
  AlertLines,
  CrossSectionSelect,
  CurrentTime,
  DomainChangeEvent,
  isNumberDomain,
  Margin,
  ZoomHandler,
  toggleChartVisibility,
  CartesianAxes,
  MouseOver,
  Visitor,
  MouseOverDirection,
} from '@deltares/fews-web-oc-charts'
import ChartLegend from '@/components/charts/ChartLegend.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ThresholdLine } from '@/lib/charts/types/ThresholdLine'
import { Series } from '@/lib/timeseries/timeSeries'
import { extent } from 'd3'
import {
  getHorizontalColorCodeTags,
  getSeriesTags,
  getThresholdTag,
  type Tag,
} from '@/lib/charts/tags'
import { type ChartsSettings } from '@/lib/topology/componentSettings'
import { getAxisOptions } from '@/lib/charts/axisOptions'
import { PanHandler } from '@deltares/fews-web-oc-charts'
import { ModifierKey } from '@deltares/fews-web-oc-charts'
import { useUserSettingsStore } from '@/stores/userSettings'

import { clearChart, redraw, refreshChart } from '@/lib/charts/timeSeriesChart'
import { getThresholdValues, isUniqueThreshold } from '@/lib/charts/thresholds'
import { useSeriesUpdateChartData } from '@/services/useSeriesUpdateChartData'
import { useI18n } from 'vue-i18n'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  highlightTime?: Date
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  verticalProfile?: boolean
  forecastLegend?: string
  settings: ChartsSettings['timeSeriesChart']
}

const props = defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')

const userSettingsStore = useUserSettingsStore()
defineExpose({
  getSvgElement,
  axisAccept,
})

const { locale } = useI18n()

let thresholdLines!: ThresholdLine[]
let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
let zoom!: ZoomHandler

const margin = ref<Margin>({})
const legendTags = ref<Tag[]>([])
const showThresholds = ref(true)
const chartContainer = useTemplateRef('chartContainer')
const axisTime = ref<CrossSectionSelect<Date>>()

onMounted(() => {
  if (chartContainer.value) {
    const axisOptions = getAxisOptions(props.config, props.settings, {
      isVerticalProfile: props.verticalProfile,
      locale: locale.value,
    })
    axis = new CartesianAxes(
      chartContainer.value,
      props.verticalProfile ? 800 : null,
      props.verticalProfile ? 1200 : null,
      axisOptions,
    )
    axis.addEventListener('update:x-domain', onUpdateXDomain)

    // Keep margin in sync with axis.margin
    axis.margin = new Proxy(axis.margin, {
      set: (target, property, value) => {
        const res = Reflect.set(target, property, value)
        margin.value = { ...target }
        return res
      },
    })
    margin.value = { ...axis.margin }

    const mouseOver = new MouseOver({
      direction: props.verticalProfile
        ? MouseOverDirection.Vertical
        : MouseOverDirection.Horizontal,
    })

    const wheelMode = userSettingsStore.scrollZoomMode
    const scrollModifierKey = ModifierKey.Shift
    if (props.zoomHandler) {
      zoom = props.zoomHandler
      zoom.updateOptions({ wheelMode, scrollModifierKey })
    } else {
      zoom = new ZoomHandler(wheelMode, scrollModifierKey)
    }

    const currentTime = new CurrentTime({ x: { axisIndex: 0 } })

    thresholdLinesVisitor = new AlertLines(thresholdLines)

    if (props.highlightTime !== undefined) {
      axisTime.value = new CrossSectionSelect(
        props.highlightTime,
        onCrossValueChange,
        { x: { axisIndex: 0 }, draggable: false },
        [],
      )
      axis.accept(axisTime.value)
    }
    if (props.panHandler) {
      axis.accept(props.panHandler)
    }

    axis.accept(thresholdLinesVisitor)
    axis.accept(zoom)
    axis.accept(mouseOver)
    axis.accept(currentTime)
    resize()
    onValueChange()
    window.addEventListener('resize', resize)
  }
})

watch(
  () => userSettingsStore.scrollZoomMode,
  (scrollZoomMode) => zoom.updateOptions({ wheelMode: scrollZoomMode }),
)

const xTicksDisplay = computed(() =>
  props.settings.xAxis.xTicks ? undefined : 'none',
)
const yTicksDisplay = computed(() =>
  props.settings.yAxis.yTicks ? undefined : 'none',
)

watch(
  () => props.highlightTime,
  (newValue) => {
    if (newValue !== undefined) onCrossValueChange(newValue)
  },
)

function onUpdateXDomain(event: DomainChangeEvent): void {
  hasResetAxes.value = event.fromZoomReset
  domain.value = event.new as [Date, Date]
}

function onCrossValueChange(value: Date) {
  if (axisTime.value) {
    axisTime.value.value = value
    axisTime.value.redraw()
  }
}

function setThresholdLines() {
  const series = props.config.series
  if (!series.some((s) => s.thresholds?.length)) return

  const yDomains = props.config.yAxis?.map((y) => y.defaultDomain)

  if (showThresholds.value) {
    thresholdLinesVisitor.options = series
      .flatMap((s) => s.thresholds ?? [])
      .filter(isUniqueThreshold)

    const axisIndexMap = new Map<number, number[]>()

    series
      .filter((s) => s.thresholds?.length)
      .forEach((s) => {
        // Is the same for all thresholds in a series
        const yAxisIndex = s.thresholds![0].yAxisIndex

        const values = getThresholdValues(
          s.thresholds ?? [],
          s.thresholdAxisScaling,
        )

        const list = axisIndexMap.get(yAxisIndex) ?? []
        list.push(...values)
        axisIndexMap.set(yAxisIndex, list)
      })

    const config = [{}, {}]
    for (const [yAxisIndex, values] of axisIndexMap.entries()) {
      const yDomain = yDomains?.[yAxisIndex]
      const domain =
        yDomain && isNumberDomain(yDomain)
          ? extent([...yDomain, ...values])
          : extent(values)
      if (isNumberDomain(domain)) {
        config[yAxisIndex] = { defaultDomain: domain, nice: true }
      }
    }
    return { y: config }
  } else {
    thresholdLinesVisitor.options = []
    return { y: props.config.yAxis }
  }
}

function setTags() {
  const series = props.config?.series ?? []
  const isHorizontalColorCode = series.some(
    (s) => s.type === 'horizontalColorCode',
  )
  if (isHorizontalColorCode) {
    legendTags.value = getHorizontalColorCodeTags(series)
  } else {
    legendTags.value = getSeriesTags(axis, series, props.forecastLegend)
    const thresholdTag = getThresholdTag(props.config)
    if (thresholdTag) legendTags.value.push(thresholdTag)
  }
}

const toggleLine = (tag: Tag) => {
  if (tag.id === 'Thresholds') {
    showThresholds.value = !tag.disabled
    const zoomOptions = setThresholdLines()
    if (zoomOptions === undefined) return
    axis.setOptions(zoomOptions)
    axis.redraw({ x: { autoScale: false }, y: { autoScale: true } })
  } else {
    tag.seriesIds?.forEach((id) => toggleChartVisibility(axis, id))
    axis.redraw({ x: { autoScale: false }, y: { autoScale: true } })
  }
}

const resize = () => {
  nextTick(() => {
    axis.resize()
  })
}

const onValueChange = () => {
  clearChart(axis)

  refreshChart(axis, props.config, props.series)
  redraw(axis, props.config)
  setThresholdLines()
  hasResetAxes.value = true

  setTags()
}

const beforeDestroy = () => {
  window.removeEventListener('resize', resize)
}

watch(domain, (newDomain) => {
  axis.redraw({ x: { domain: newDomain } })
})

const { hasResetAxes } = useSeriesUpdateChartData(
  () => props.series,
  () => props.config,
  () => axis,
)

watch(() => props.config, onValueChange)
onBeforeUnmount(() => {
  beforeDestroy()
})

function getSvgElement() {
  return axis.svg.node()
}

function axisAccept(visitor: Visitor) {
  axis?.accept(visitor)
}
</script>

<style scoped>
.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 332px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
  max-height: none;
}

.chart-with-chips {
  display: flex;
  position: relative;
  flex: 1 1 80%;
  max-height: max(50%, 400px);
  width: 100%;
}

.chart-with-chips.vertical-profile {
  max-height: unset;
  max-width: 600px;
  flex: 1 1 80%;
  height: 100%;
}

:deep([class*='y-axis-'] > .tick) {
  display: v-bind(yTicksDisplay);
}

:deep([class*='x-axis-']) {
  display: v-bind(xTicksDisplay);
}
</style>
