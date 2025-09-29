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
  VerticalMouseOver,
  Visitor,
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
import {
  clearChart,
  redraw,
  refreshChart,
  updateChartData,
} from '@/lib/charts/timeSeriesChart'
import { difference } from 'lodash-es'
import { getThresholdValues, isUniqueThreshold } from '@/lib/charts/thresholds'

interface Props {
  config: ChartConfig
  series?: Record<string, Series>
  highlightTime?: Date
  isLoading?: boolean
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  verticalProfile?: boolean
  forecastLegend?: string
  settings: ChartsSettings['timeSeriesChart']
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      id: '',
      title: '',
      series: [],
    }
  },
  series: () => {
    return {}
  },
})

const domain = defineModel<[Date, Date]>('domain')

const userSettingsStore = useUserSettingsStore()
defineExpose({
  getSvgElement,
  axisAccept,
})

let thresholdLines!: ThresholdLine[]
let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
let zoom!: ZoomHandler

const margin = ref<Margin>({})
const legendTags = ref<Tag[]>([])
const showThresholds = ref(true)
const chartContainer = useTemplateRef('chartContainer')
const axisTime = ref<CrossSectionSelect<Date>>()
const hasRenderedOnce = ref(false)
const hasResetAxes = ref(true)

onMounted(() => {
  if (chartContainer.value) {
    const axisOptions = getAxisOptions(
      props.config,
      props.settings,
      props.verticalProfile,
    )
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

    // Use custom number formatter that just converts the value to a string;
    // appropriate rounding has already been done by the backend.
    const mouseOver = props.verticalProfile
      ? new VerticalMouseOver(undefined, (value: number) => value.toString())
      : new MouseOver(undefined, (value: number) => value.toString())

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

const setThresholdLines = () => {
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

    const config = props.config.yAxis ?? [{}, {}]
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
    axis.setOptions({ y: config })
  } else {
    thresholdLinesVisitor.options = []
    axis.setOptions({ y: props.config.yAxis })
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
    setThresholdLines()
    redraw(axis, props.config)
  } else {
    tag.seriesIds?.forEach((id) => toggleChartVisibility(axis, id))
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

watch(
  () =>
    Object.keys(props.series).map(
      (k) => `${k}-${props.series[k].lastUpdated?.getTime()}`,
    ),
  (newValue, oldValue) => {
    const newSeriesIds = difference(newValue, oldValue).map((id) =>
      id.substring(0, id.lastIndexOf('-')),
    )
    const requiredSeries = props.config?.series.filter((s) =>
      s.dataResources.some((resourceId) => newSeriesIds.includes(resourceId)),
    )
    if (requiredSeries.length > 0) {
      hasResetAxes.value = updateChartData(
        axis,
        requiredSeries,
        props.series,
        hasResetAxes.value,
      )

      if (!hasRenderedOnce.value) {
        redraw(axis, props.config)
        hasRenderedOnce.value = true
      }
    }
  },
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
