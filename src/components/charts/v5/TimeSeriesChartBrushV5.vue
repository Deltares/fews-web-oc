<template>
  <div ref="chartContainer" class="brush-chart-container"></div>
</template>

<script setup lang="ts">
import { brush, handleCache, ModifierKey } from '@deltares/fews-web-oc-charts'
import { computed, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type { ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'
import { toPlotConfig } from '@/lib/charts/v5/toPlotConfig'
import { usePlot } from '@/lib/charts/v5/usePlot'
import { useSeriesStores } from '@/lib/charts/v5/useSeriesStores'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useChartHandlers } from '@/services/useChartHandlers'
import {
  initializeV5TimeScale,
  updateTimeScaleDomain,
} from '@/services/useChartHandlers/v5'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesChart']
  fullDomain: [Date, Date]
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
  modifier: ModifierKey.None,
  persistent: true,
  ...(sync ? { targets: { x: sync.timeScale } } : {}),
})
const stores = useSeriesStores(() => props.series)
const chartTheme = computed(() => {
  const value = userSettings.get('ui.theme')?.value
  return value === 'light' || value === 'dark' ? value : 'auto'
})

if (sync) {
  initializeV5TimeScale(sync, 'brushTimeScale', props.fullDomain)
}

const handles = handleCache()
const plotConfig = computed(() =>
  toPlotConfig(
    props.config,
    stores.value,
    props.settings,
    {
      domain: props.fullDomain,
      locale: locale.value,
      theme: chartTheme.value,
      colorContrast: userSettings.chartColorContrast,
      themeElement: chartContainer.value ?? undefined,
      sharedTimeScale: sync?.brushTimeScale,
      align: sync?.align,
      autoMargins: false,
      isBrush: true,
      plugins: [interaction],
      handles,
    },
    props.series,
  ),
)
usePlot(chartContainer, plotConfig)

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
    if (sync) updateTimeScaleDomain(sync.timeScale, nextDomain)
  },
  { immediate: true },
)
</script>

<style scoped>
.brush-chart-container {
  --fews-chart-background: var(--canvas-fill);
  --fews-chart-grid: var(--theme-color);
  --fews-chart-font-family: var(--font-family);
  --fews-chart-font-size: 14.4px;
  width: 100%;
  height: 60px;
  min-width: 0;
  overflow: hidden;
}
</style>
