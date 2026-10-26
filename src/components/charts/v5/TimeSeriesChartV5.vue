<template>
  <div
    class="chart-v5 d-flex flex-column"
    :class="{
      'vertical-profile': verticalProfile,
      maximized,
    }"
    :style="chartLayoutStyle"
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
      <template #activator="{ props: tooltipProps }">
        <v-btn
          class="chart-maximize-btn"
          icon
          variant="plain"
          v-bind="tooltipProps"
          :aria-label="
            maximized ? $t('common.restoreChart') : $t('common.maximizeChart')
          "
          @click="emit('toggle-maximize')"
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
      :style="chartContainerStyle"
    ></div>
    <div ref="brushContainer" class="brush-container">
      <slot name="brush" :margin />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, type CSSProperties } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import {
  ModifierKey,
  handleCache,
  type LayoutChangeDetail,
  crosshair,
  crossSectionSelect,
  pan,
  tooltip,
  zoom,
} from '@deltares/fews-web-oc-charts'
import ChartLegend from '@/components/charts/ChartLegend.vue'
import ChartLegendOverlay from '@/components/charts/ChartLegendOverlay.vue'
import type { Tag } from '@/lib/charts/tags'
import { getV5LegendTags } from '@/lib/charts/v5/legend'
import type {
  TimeSeriesChartExportOptions,
  TimeSeriesChartProps,
  ChartMargin,
} from '@/lib/charts/types/TimeSeriesChartProps'
import { toPlotConfig } from '@/lib/charts/v5/toPlotConfig'
import { usePlot } from '@/lib/charts/v5/usePlot'
import { useSeriesStores } from '@/lib/charts/v5/useSeriesStores'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useChartHandlers } from '@/services/useChartHandlers'
import {
  initializeV5TimeScale,
  updateTimeScaleDomain,
} from '@/services/useChartHandlers/v5'

const props = defineProps<TimeSeriesChartProps>()
const emit = defineEmits<{
  'toggle-maximize': []
}>()
const domain = defineModel<[Date, Date]>('domain')
const chartGroup = props.group ?? useChartHandlers()
const chartContainer = useTemplateRef<HTMLElement>('chartContainer')
const legendContainer = useTemplateRef<HTMLElement>('legendContainer')
const brushContainer = useTemplateRef<HTMLElement>('brushContainer')
const legendContainerHeight = ref(0)
const brushContainerHeight = ref(0)
useResizeObserver(
  legendContainer,
  ([entry]) => (legendContainerHeight.value = entry.contentRect.height),
)
useResizeObserver(
  brushContainer,
  ([entry]) => (brushContainerHeight.value = entry.contentRect.height),
)
const userSettings = useUserSettingsStore()
const { locale } = useI18n()
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const margin = ref<ChartMargin>({})
const legendTags = ref<Tag[]>([])

function configuredDomain(): [Date, Date] | [number, number] | undefined {
  const axis = props.config.xAxis?.find((candidate) =>
    ['bottom', 'top'].includes(candidate.position ?? 'bottom'),
  )
  const values = axis?.domain
  if (!values) return undefined
  if (values[0] instanceof Date && values[1] instanceof Date) {
    return [values[0], values[1]]
  }
  return [Number(values[0]), Number(values[1])]
}

if (!props.verticalProfile) {
  initializeV5TimeScale(
    chartGroup.v5,
    'timeScale',
    domain.value ?? configuredDomain(),
  )
}

const zoomInteraction = zoom({
  mode: 'auto',
  wheel: userSettings.scrollZoomMode,
  wheelModifier: userSettings.scrollZoomModifierKey,
  modifier: getDragZoomModifier(),
  reset: 'initial',
})
const panInteraction = pan({
  mode: props.verticalProfile ? 'y' : 'x',
  modifier: userSettings.panModifierKey,
})
const crosshairInteraction = crosshair({
  mode: props.verticalProfile ? 'y' : 'x',
  pointer: props.verticalProfile ? undefined : chartGroup.v5?.pointer,
  labels: props.verticalProfile ? {} : { x: 'x' },
})
const crossSectionInteraction = crossSectionSelect(
  props.highlightTime?.getTime() ?? 0,
  undefined,
  {
    x: 'x',
    marks: props.highlightTime ? 'all' : 'none',
    draggable: false,
  },
)
const tooltipInteraction = tooltip({
  axis: 'x',
  showX: false,
  position: 'right',
  crosshair: crosshairInteraction,
  formatValue: (_value, context) => context.defaultText,
  formatUnit: ({ axis, mark }) => (axis === 'y' ? getUnitForMark(mark.id) : ''),
})
const interactions = [
  zoomInteraction,
  panInteraction,
  crosshairInteraction,
  tooltipInteraction,
  crossSectionInteraction,
]

function getDragZoomModifier(): ModifierKey {
  return userSettings.panModifierKey === ModifierKey.None
    ? ModifierKey.Shift
    : ModifierKey.None
}

const plotWeight = computed(() => props.config.plotWeight)

const chartLayoutStyle = computed<CSSProperties>(() => {
  const flexDirection = props.settings.legend.placement.includes('under')
    ? 'column-reverse'
    : 'column'
  if (plotWeight.value === undefined) return { flexDirection }

  const top = margin.value.top ?? 0
  const bottom = margin.value.bottom ?? 0
  const basis =
    top + bottom + brushContainerHeight.value + legendContainerHeight.value
  return {
    flexDirection,
    flexBasis: `${basis}px`,
    flexGrow: plotWeight.value,
    flexShrink: 0,
    minHeight: `${basis + Math.max(plotWeight.value, 80)}px`,
  }
})

const chartContainerStyle = computed<CSSProperties>(() => {
  if (plotWeight.value === undefined) return {}
  const axisHeight = 25 + 40 // axis.top + axis.bottom
  return {
    flex: `${plotWeight.value} 0 ${axisHeight}px`,
    minHeight: 0,
  }
})

const stores = useSeriesStores(() => props.series)
const chartTheme = computed(() => {
  const value = userSettings.get('ui.theme')?.value
  return value === 'light' || value === 'dark' ? value : 'auto'
})
const handles = handleCache()
const plotConfig = computed(() =>
  toPlotConfig(
    props.config,
    stores.value,
    props.settings,
    {
      domain: domain.value,
      locale: locale.value,
      theme: chartTheme.value,
      colorContrast: userSettings.chartColorContrast,
      themeElement: chartContainer.value ?? undefined,
      verticalProfile: props.verticalProfile,
      plugins: interactions,
      handles,
      sharedTimeScale: chartGroup.v5?.timeScale,
      align: props.verticalProfile ? undefined : chartGroup.v5?.align,
    },
    props.series,
  ),
)
const plot = usePlot(chartContainer, plotConfig)

watch(
  locale,
  (nextLocale) => {
    chartGroup.v5?.timeScale.update({ locale: nextLocale, timeZone })
  },
  { immediate: true },
)

watch(
  () => userSettings.scrollZoomMode,
  (wheel) => zoomInteraction.update({ wheel }),
)

watch(
  () => userSettings.scrollZoomModifierKey,
  (wheelModifier) => zoomInteraction.update({ wheelModifier }),
)

watch(
  () => userSettings.panModifierKey,
  (modifier) => {
    panInteraction.update({ modifier })
    zoomInteraction.update({ modifier: getDragZoomModifier() })
  },
)

watch(
  () => props.verticalProfile,
  (verticalProfile) => {
    crosshairInteraction.update({ mode: verticalProfile ? 'y' : 'x' })
    panInteraction.update({ mode: verticalProfile ? 'y' : 'x' })
    crosshairInteraction.update({
      pointer: verticalProfile ? undefined : chartGroup.v5?.pointer,
      labels: verticalProfile ? {} : { x: 'x' },
    })
  },
)

watch(domain, (nextDomain) => {
  if (!props.verticalProfile && chartGroup.v5) {
    updateTimeScaleDomain(chartGroup.v5.timeScale, nextDomain)
  }
})

watch(
  () => props.config,
  () => {
    if (!props.verticalProfile) {
      initializeV5TimeScale(
        chartGroup.v5,
        'timeScale',
        domain.value ?? configuredDomain(),
      )
    }
  },
)

watch(
  () => props.highlightTime,
  (highlightTime) => {
    crossSectionInteraction.update({
      marks: highlightTime ? 'all' : 'none',
    })
    if (highlightTime) {
      crossSectionInteraction.setValue(highlightTime.getTime())
    }
  },
  { immediate: true },
)

watch(
  plot,
  (currentPlot, _previousPlot, onCleanup) => {
    if (!currentPlot) {
      legendTags.value = []
      return
    }

    const controller = new AbortController()
    onCleanup(() => controller.abort())

    if (!props.verticalProfile && chartGroup.v5) {
      currentPlot.subscribe(
        chartGroup.v5.timeScale.domain,
        (nextDomain) => {
          domain.value = [new Date(nextDomain[0]), new Date(nextDomain[1])]
        },
        { immediate: true },
      )
    }

    const updateLegend = (entries = currentPlot.legend.entries.get()) => {
      legendTags.value = getV5LegendTags(entries, props.forecastLegend)
    }

    updateLegend()
    currentPlot.on('legendchange', ({ entries }) => updateLegend(entries), {
      signal: controller.signal,
    })
    currentPlot.on(
      'domainchange',
      ({ scale, domain: nextDomain, explicit }) => {
        if (
          scale !== 'x' ||
          !explicit ||
          typeof nextDomain[0] !== 'number' ||
          typeof nextDomain[1] !== 'number'
        ) {
          return
        }
        domain.value = [new Date(nextDomain[0]), new Date(nextDomain[1])]
      },
      { signal: controller.signal },
    )
    const updateMargin = ({ size, regions }: LayoutChangeDetail) => {
      margin.value = {
        left: regions.plot.x,
        top: regions.plot.y,
        right: Math.max(0, size.width - regions.plot.x - regions.plot.width),
        bottom: Math.max(0, size.height - regions.plot.y - regions.plot.height),
      }
    }
    updateMargin({
      size: currentPlot.size.get(),
      regions: currentPlot.regions.get(),
      previous: undefined,
    })
    currentPlot.on('layoutchange', updateMargin, {
      signal: controller.signal,
    })
  },
  { immediate: true },
)

watch(
  () => props.forecastLegend,
  () => {
    if (plot.value) {
      legendTags.value = getV5LegendTags(
        plot.value.legend.entries.get(),
        props.forecastLegend,
      )
    }
  },
)

function getUnitForMark(markId: string | undefined) {
  if (!markId) return ''

  for (const [index, item] of props.config.series.entries()) {
    const markIdPrefix = `${index}:${item.id}`
    const resourceIndex =
      markId === markIdPrefix
        ? 0
        : item.dataResources.findIndex(
            (_, resourceIndex) => markId === `${markIdPrefix}:${resourceIndex}`,
          )
    if (resourceIndex === -1) continue

    const resourceId = item.dataResources[resourceIndex]
    return item.unit || props.series[resourceId]?.header.unit || ''
  }

  return ''
}

function toggleLine(tag: Tag, event: MouseEvent | KeyboardEvent) {
  if (!tag.interactive || !plot.value) return

  if (event.altKey) {
    plot.value.legend.isolate(tag.id, 'external')
  } else {
    plot.value.legend.setVisible(tag.id, !tag.disabled, 'external')
  }
}

function getSvgElement() {
  return plot.value?.element ?? null
}

function exportImage(_options: TimeSeriesChartExportOptions) {
  return undefined
}

defineExpose({ getSvgElement, exportImage })
</script>

<style scoped>
.chart-v5 {
  position: relative;
  flex: 1 1 80%;
  min-height: 160px;
  min-width: 0;
  max-height: max(50%, 275px);
  width: 100%;
}

@container (height >= 825px) {
  .chart-v5 {
    max-height: max(33.333%, 275px);
  }
}

.chart-v5.maximized {
  flex: 1 1 100%;
  max-height: none;
  max-width: none;
}

.chart-v5:not(.maximized):not(.vertical-profile):only-child {
  max-height: max(50%, 400px);
}

.chart-v5:not(.maximized):not(.vertical-profile):is(
    :nth-child(1):nth-last-child(2),
    :nth-child(2):nth-last-child(1)
  ) {
  max-height: 50%;
}

.chart-v5.vertical-profile {
  max-height: unset;
  max-width: 600px;
  flex: 1 1 80%;
  height: 100%;
}

.chart-container {
  --fews-chart-background: var(--canvas-fill);
  --fews-chart-grid: var(--theme-color);
  --fews-chart-font-family: var(--font-family);
  --fews-chart-font-size: 14.4px;
  flex: 1 1 100%;
  min-height: 160px;
  min-width: 0;
  /* Clip the plot's pixel-sized SVG until it re-renders at the new size. */
  overflow: hidden;
}

.brush-container {
  flex: 0 0 auto;
}

.chart-maximize-btn {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
}
</style>
