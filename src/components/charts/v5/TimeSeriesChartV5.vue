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
    <div ref="chartContainer" class="chart-container"></div>
    <div class="brush-container">
      <slot name="brush" :margin="{}" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ModifierKey,
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

const props = defineProps<TimeSeriesChartProps>()
const emit = defineEmits<{
  'toggle-maximize': []
}>()
const domain = defineModel<[Date, Date]>('domain')
const chartContainer = useTemplateRef<HTMLElement>('chartContainer')
const userSettings = useUserSettingsStore()
const { locale } = useI18n()
const margin = ref<ChartMargin>({})
const legendTags = ref<Tag[]>([])

const zoomInteraction = zoom({
  mode: 'xy',
  wheel: userSettings.scrollZoomMode,
  modifier: ModifierKey.None,
  reset: 'initial',
})
const panInteraction = pan({
  mode: props.verticalProfile ? 'y' : 'x',
  modifier: ModifierKey.Shift,
})
const crosshairInteraction = crosshair({
  mode: props.verticalProfile ? 'y' : 'x',
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
  axis: 'xy',
  showX: true,
  position: 'top',
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

const chartLayoutStyle = computed(
  () =>
    ({
      flexDirection: props.settings.legend.placement.includes('under')
        ? 'column-reverse'
        : 'column',
    }) as const,
)

const stores = useSeriesStores(() => props.series)
const chartTheme = computed(() => {
  const value = userSettings.get('ui.theme')?.value
  return value === 'light' || value === 'dark' ? value : 'auto'
})
const plotConfig = computed(() =>
  toPlotConfig(
    props.config,
    stores.value,
    props.settings,
    {
      domain: domain.value,
      locale: locale.value,
      theme: chartTheme.value,
      themeElement: chartContainer.value ?? undefined,
      verticalProfile: props.verticalProfile,
      plugins: interactions,
    },
    props.series,
  ),
)
const plot = usePlot(chartContainer, plotConfig)

watch(
  () => userSettings.scrollZoomMode,
  (wheel) => zoomInteraction.update({ wheel }),
)

watch(
  () => props.verticalProfile,
  (verticalProfile) => {
    crosshairInteraction.update({ mode: verticalProfile ? 'y' : 'x' })
    panInteraction.update({ mode: verticalProfile ? 'y' : 'x' })
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
    if (
      markId === markIdPrefix ||
      item.dataResources.some(
        (_, resourceIndex) => markId === `${markIdPrefix}:${resourceIndex}`,
      )
    ) {
      return item.unit
    }
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
  flex: 1 1 100%;
  min-height: 160px;
  min-width: 0;
}

.chart-container {
  flex: 1 1 100%;
  min-height: 160px;
  min-width: 0;
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
