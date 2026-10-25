<template>
  <div
    class="chart-v5 d-flex flex-column"
    :class="{
      'vertical-profile': verticalProfile,
      maximized,
    }"
  >
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
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  TimeSeriesChartExportOptions,
  TimeSeriesChartProps,
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
    },
    props.series,
  ),
)
const plot = usePlot(chartContainer, plotConfig)

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
