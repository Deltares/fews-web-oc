<template>
  <div ref="chartContainer" class="brush-chart-container"></div>
</template>

<script setup lang="ts">
import { brush, subscribe } from '@deltares/fews-web-oc-charts'
import { computed, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type {
  ChartGroup,
  ChartMargin,
} from '@/lib/charts/types/TimeSeriesChartProps'
import { toPlotConfig } from '@/lib/charts/v5/toPlotConfig'
import { usePlot } from '@/lib/charts/v5/usePlot'
import { useSeriesStores } from '@/lib/charts/v5/useSeriesStores'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useChartHandlers } from '@/services/useChartHandlers'
import {
  initializeV5TimeScale,
  updateBrushSelection,
  updateTimeScaleDomain,
} from '@/services/useChartHandlers/v5'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesChart']
  fullDomain: [Date, Date]
  mainChartMargin?: ChartMargin
  group?: ChartGroup
}

const props = defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')
const chartGroup = props.group ?? useChartHandlers()
const sync = chartGroup.v5
const chartContainer = useTemplateRef<HTMLElement>('chartContainer')
const { locale } = useI18n()
const userSettings = useUserSettingsStore()
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const interaction = brush({
  mode: 'x',
  persistent: true,
  ...(sync ? { selection: sync.selection } : {}),
})
const stores = useSeriesStores(() => props.series)
const chartTheme = computed(() => {
  const value = userSettings.get('ui.theme')?.value
  return value === 'light' || value === 'dark' ? value : 'auto'
})

if (sync) {
  initializeV5TimeScale(sync, 'brushTimeScale', props.fullDomain)
}

const plotConfig = computed(() =>
  toPlotConfig(
    props.config,
    stores.value,
    props.settings,
    {
      domain: props.fullDomain,
      locale: locale.value,
      theme: chartTheme.value,
      themeElement: chartContainer.value ?? undefined,
      sharedTimeScale: sync?.brushTimeScale,
      margins: props.mainChartMargin ?? {
        top: 0,
        right: 50,
        bottom: 0,
        left: 50,
      },
      autoMargins: false,
      isBrush: true,
      plugins: [interaction],
    },
    props.series,
  ),
)
const plot = usePlot(chartContainer, plotConfig)

watch(
  locale,
  (nextLocale) => {
    sync?.brushTimeScale.update({ locale: nextLocale, timeZone })
  },
  { immediate: true },
)

watch(
  () => props.fullDomain,
  (fullDomain) => {
    if (sync) {
      initializeV5TimeScale(sync, 'brushTimeScale', fullDomain)
    }
  },
)

watch(
  domain,
  (nextDomain) => {
    if (!sync) return
    updateBrushSelection(sync, nextDomain)
    updateTimeScaleDomain(sync.timeScale, nextDomain)
  },
  { immediate: true },
)

watch(
  plot,
  (currentPlot, _previousPlot, onCleanup) => {
    if (!currentPlot || !sync) return

    const controller = new AbortController()
    onCleanup(() => controller.abort())
    subscribe(
      sync.selection.selection,
      (selection) => {
        const range = selection?.ranges.find(({ axis }) => axis === 'x')?.range
        if (
          range &&
          typeof range[0] === 'number' &&
          typeof range[1] === 'number'
        ) {
          updateTimeScaleDomain(sync.timeScale, [
            new Date(range[0]),
            new Date(range[1]),
          ])
        }
      },
      { signal: controller.signal },
    )
  },
  { immediate: true },
)
</script>

<style scoped>
.brush-chart-container {
  width: 100%;
  height: 60px;
  min-width: 0;
  overflow: hidden;
}
</style>
