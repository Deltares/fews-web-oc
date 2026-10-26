<template>
  <div
    class="chart-with-chips d-flex flex-column"
    :class="{
      'vertical-profile': verticalProfile,
      maximized: maximized,
      'default-plot-height': config.plotWeight === undefined,
    }"
    :style="getPlotContainerStyle()"
  >
    <div
      v-if="
        settings.legend.placement === 'above chart' ||
        settings.legend.placement === 'under chart'
      "
      ref="legendContainer"
    >
      <ChartLegend
        :tags="legendTags"
        :margin="margin"
        :settings="settings.legend"
        @toggle-line="toggleLine"
      />
    </div>
    <ChartLegendOverlay
      v-else
      :tags="legendTags"
      :margin="margin"
      :settings="settings.legend"
      @toggle-line="toggleLine"
    />
    <v-tooltip
      :text="maximized ? $t('common.restoreChart') : $t('common.maximizeChart')"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          class="chart-maximize-btn"
          icon
          variant="plain"
          v-bind="props"
          :aria-label="
            maximized ? $t('common.restoreChart') : $t('common.maximizeChart')
          "
          @click="$emit('toggle-maximize')"
        >
          <v-icon>{{
            maximized ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'
          }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <div
      ref="chartContainer"
      class="chart-container"
      :style="getChartLayoutStyle()"
    ></div>
    <div ref="brushContainer" class="brush-container">
      <slot name="brush" :margin="margin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  computed,
  useTemplateRef,
  type CSSProperties,
} from 'vue'
import { useResizeObserver } from '@vueuse/core'
import {
  AlertLines,
  CrossSectionSelect,
  CurrentTime,
  DomainChangeEvent,
  isNumberDomain,
  Legend,
  ZoomHandler,
  toggleChartVisibility,
  CartesianAxes,
  MouseOver,
  MouseOverDirection,
  WheelMode,
  ZoomEvent,
  PanHandler,
} from '@deltares/fews-web-oc-charts'
import ChartLegend from '@/components/charts/ChartLegend.vue'
import ChartLegendOverlay from '@/components/charts/ChartLegendOverlay.vue'
import type {
  ChartWheelMode,
  TimeSeriesChartExportOptions,
  TimeSeriesChartProps,
} from '@/lib/charts/types/TimeSeriesChartProps'
import { extent } from 'd3'
import {
  getHorizontalColorCodeTags,
  getSeriesTags,
  getThresholdTag,
  type Tag,
} from '@/lib/charts/tags'
import type { ChartMargin } from '@/lib/charts/types/TimeSeriesChartProps'
import { getAxisOptions } from '@/lib/charts/v4/axisOptions'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  attachV4PanHandler,
  getV4ChartHandlers,
  updateV4PanModifierKey,
} from '@/services/useChartHandlers/v4'

import {
  clearChart,
  redraw,
  refreshChart,
} from '@/lib/charts/v4/timeSeriesChart'
import { getThresholdValues, isUniqueThreshold } from '@/lib/charts/thresholds'
import { toV4AlertLineOptions } from '@/lib/charts/v4/thresholds'
import { useSeriesUpdateChartData } from '@/services/useSeriesUpdateChartData'
import { useI18n } from 'vue-i18n'

interface Props extends TimeSeriesChartProps {
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
}

const props = defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')
const v4Handlers = computed(() => getV4ChartHandlers(props.group))
const zoomHandler = computed(
  () =>
    props.zoomHandler ??
    (props.verticalProfile
      ? v4Handlers.value?.sharedVerticalZoomHandler
      : v4Handlers.value?.sharedZoomHandler),
)
const userSettingsStore = useUserSettingsStore()
const emit = defineEmits<{
  'toggle-maximize': []
}>()
defineExpose({
  getSvgElement,
  exportImage,
})

const { locale } = useI18n()

function toV4WheelMode(mode: ChartWheelMode): WheelMode {
  switch (mode) {
    case 'y':
      return WheelMode.Y
    case 'xy':
      return WheelMode.XY
    case 'none':
      return WheelMode.NONE
    default:
      return WheelMode.X
  }
}

let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
let zoom!: ZoomHandler

const margin = ref<ChartMargin>({})
const legendTags = ref<Tag[]>([])
const showThresholds = ref(true)
const chartContainer = useTemplateRef('chartContainer')
const legendContainer = useTemplateRef<HTMLDivElement>('legendContainer')
const brushContainer = useTemplateRef('brushContainer')
const legendContainerHeight = ref(0)
const brushContainerHeight = ref(0)
const axisTime = ref<CrossSectionSelect<Date>>()
let zoomedY = false

onMounted(() => {
  if (!chartContainer.value) return

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

  const wheelMode = toV4WheelMode(userSettingsStore.scrollZoomMode)
  const scrollModifierKey = userSettingsStore.scrollZoomModifierKey
  if (zoomHandler.value) {
    zoom = zoomHandler.value
    zoom.updateOptions({ wheelMode, scrollModifierKey })
  } else {
    zoom = new ZoomHandler(wheelMode, scrollModifierKey)
  }
  zoom.addEventListener('zoom', onZoom)
  zoom.addEventListener('reset-zoom', onResetZoom)

  const currentTime = new CurrentTime({ x: { axisIndex: 0 } })

  thresholdLinesVisitor = new AlertLines([])
  attachAxisVisitors(mouseOver, currentTime)
  resize()
  onValueChange()
})

// Resizes whenever the chart's own container changes size (e.g. maximize toggle, window resize, layout shifts)
useResizeObserver(chartContainer, () => resize())
useResizeObserver(
  legendContainer,
  ([entry]) => (legendContainerHeight.value = entry.contentRect.height),
)
useResizeObserver(
  brushContainer,
  ([entry]) => (brushContainerHeight.value = entry.contentRect.height),
)

watch(
  [
    () => userSettingsStore.scrollZoomMode,
    () => userSettingsStore.scrollZoomModifierKey,
  ],
  ([scrollZoomMode, scrollZoomModifierKey]) =>
    zoom?.updateOptions({
      wheelMode: toV4WheelMode(scrollZoomMode),
      scrollModifierKey: scrollZoomModifierKey,
    }),
)

watch(
  () => userSettingsStore.panModifierKey,
  (modifierKey) => {
    if (props.group && !props.panHandler && !props.verticalProfile) {
      updateV4PanModifierKey(props.group, modifierKey)
    }
  },
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
  domain.value = event.new as [Date, Date]
}

function onCrossValueChange(value: Date) {
  if (axisTime.value) {
    axisTime.value.value = value
    axisTime.value.redraw()
  }
}

function onZoom(event: ZoomEvent) {
  zoomedY = zoomedY || event.mode === 'y' || event.mode === 'xy'
  resetAxes(!zoomedY)
}

function onResetZoom() {
  zoomedY = false
  resetAxes(true)
}

function setThresholdLines() {
  const series = props.config.series
  thresholdLinesVisitor.options = []
  if (!series.some((s) => s.thresholds?.length)) {
    axis.options.y?.forEach((y) => delete y.defaultDomain)
    return { y: props.config.yAxis }
  }

  const yDomains = props.config.yAxis?.map((y) => y.defaultDomain)

  if (showThresholds.value) {
    thresholdLinesVisitor.options = toV4AlertLineOptions(
      series.flatMap((s) => s.thresholds ?? []).filter(isUniqueThreshold),
    )

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
    // FIXME: fix setOptions to make it possible to delete settings like defaultDomain without having to reset the entire axis options
    axis.options.y?.forEach((y) => delete y.defaultDomain)
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
    legendTags.value = getSeriesTags(
      (id) => {
        const chart = axis.charts.find((chart) => chart.id === id)
        return chart?.drawLegendSymbol(undefined, true) ?? undefined
      },
      series,
      props.forecastLegend,
    )
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
    axis.redraw({ y: { autoScale: !zoomedY } })
  } else {
    tag.seriesIds?.forEach((id) => toggleChartVisibility(axis, id))
    axis.redraw({ y: { autoScale: !zoomedY } })
  }
}

// The svg has a fixed pixel width/height (set by axis.resize()), so while a resize is in
// flight it still occupies its old size and can skew the surrounding flex layout (e.g. when
// siblings are toggling visibility). Take it out of flow (rather than hiding it, which would
// flash) so the container is sized by pure flexbox rules, then resize once that has settled.
const resize = () => {
  const svgNode = axis?.svg.node()
  svgNode?.style.setProperty('position', 'absolute')
  requestAnimationFrame(() => {
    axis?.resize()
    svgNode?.style.removeProperty('position')
  })
}

function isAllDataLoaded() {
  return props.config.series.every((s) =>
    s.dataResources.every((id) => props.series[id] !== undefined),
  )
}

const onValueChange = () => {
  clearChart(axis)

  refreshChart(axis, props.config, props.series)
  const zoomOptions = setThresholdLines()
  if (zoomOptions) {
    axis.setOptions(zoomOptions)
  }
  // Delay automatic margin calculation until thresholds and all series data are present
  axis.options.automargin = isAllDataLoaded()
  redraw(axis, props.config)
  resetAxes(false)
  setTags()
}

const beforeDestroy = () => {
  zoom?.removeEventListener('zoom', onZoom)
  zoom?.removeEventListener('reset-zoom', onResetZoom)
}

watch(domain, (newDomain) => {
  if (!axis) return
  axis.redraw({ x: { domain: newDomain } })
  resetAxes(!zoomedY)
})

const { resetAxes } = useSeriesUpdateChartData(
  () => props.series,
  () => props.config,
  () => axis,
)

watch(
  () => props.config,
  () => {
    if (!axis) return
    onValueChange()
  },
)

// KeepAlive can reuse this component for a subplot whose requests changed;
// when the config update ran before the new data resources had arrived,
// re-run the full refresh once they become available.
watch(
  () => props.series,
  () => {
    if (!axis) return
    const hasUncreatedChart = props.config.series.some(
      (s) =>
        s.dataResources.every((id) => props.series[id] !== undefined) &&
        !axis.charts.some((c: any) => c.id === s.id),
    )
    if (hasUncreatedChart || (!axis.options.automargin && isAllDataLoaded()))
      onValueChange()
  },
)

onBeforeUnmount(() => {
  beforeDestroy()
})

function getSvgElement() {
  return axis.svg.node()
}

function exportImage({ legend, container }: TimeSeriesChartExportOptions) {
  const visitor = new Legend(
    legend.map(({ selector, label }) => ({ selector, label })),
    container,
  )
  axis?.accept(visitor)
  return container.querySelector('svg') ?? undefined
}

const plotWeight = computed(() => {
  return props.config.plotWeight
})

function attachAxisVisitors(mouseOver: MouseOver, currentTime: CurrentTime) {
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
  } else if (props.group && !props.verticalProfile) {
    attachV4PanHandler(props.group, axis, userSettingsStore.panModifierKey)
  }

  axis.accept(thresholdLinesVisitor)
  axis.accept(zoom)
  axis.accept(mouseOver)
  axis.accept(currentTime)
}

function getPlotContainerStyle(): CSSProperties {
  if (plotWeight.value === undefined) {
    return {
      flexDirection: props.settings.legend.placement.includes('under')
        ? 'column-reverse'
        : 'column',
    }
  }
  const plotContainerBasis = getPlotContainerBasis()
  return {
    flexDirection: props.settings.legend.placement.includes('under')
      ? 'column-reverse'
      : 'column',
    flexBasis: `${plotContainerBasis}px`,
    flexGrow: plotWeight.value,
    minHeight: `${plotContainerBasis}px`,
    flexShrink: 0,
  }
}

function getPlotContainerBasis() {
  const top = margin.value.top ?? 0
  const bottom = margin.value.bottom ?? 0
  return top + bottom + brushContainerHeight.value + legendContainerHeight.value
}

function getChartLayoutStyle() {
  const grow = plotWeight.value
  if (grow === undefined) {
    return {
      flex: '1 1 100%',
    }
  }
  const flexbasis = 25 + 40 // axis.top + axis.bottom
  return {
    flex: `${grow} 0 ${flexbasis}px`,
  }
}
</script>

<style scoped>
.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 100%;
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
  --plot-height: max(50%, 275px);
  display: flex;
  position: relative;
  flex: 1 1 80%;
  width: 100%;
}

.chart-with-chips.default-plot-height:not(.vertical-profile):not(.maximized) {
  min-height: var(--plot-height);
  max-height: var(--plot-height);
}

@container (height >= 825px) {
  .chart-with-chips {
    --plot-height: max(33.333%, 275px);
  }
}

.chart-with-chips.maximized {
  flex: 1 1 100%;
  max-height: none;
  max-width: none;
}

.chart-with-chips:only-child {
  --plot-height: max(50%, 400px);
}

.chart-with-chips:first-child:nth-last-child(2),
.chart-with-chips:nth-child(2):last-child {
  --plot-height: 50%;
}

.chart-maximize-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  opacity: 0;
  width: 32px;
  height: 32px;
  transition: opacity 0.15s;
  z-index: 100;
}

.chart-with-chips:hover .chart-maximize-btn {
  opacity: 1;
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
