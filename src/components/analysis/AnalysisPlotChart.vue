<template>
  <AnalysisChartCard
    :chart="chart"
    v-bind="$attrs"
    @edit="editing = true"
    @save-as-image="downloadChartImage"
  >
    <TimeSeriesChart
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
    />
    <!-- Used to render the chart for downloading as image. -->
    <div v-if="renderingChart" class="render-chart-container">
      <div ref="render-chart-legend" />
      <TimeSeriesChart
        ref="render-chart"
        class="render-chart"
        :config
        :series
        :zoomHandler
        :settings="settings.charts.timeSeriesChart"
      />
    </div>
    <AnalysisChartEdit v-model="editing" :chart />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import AnalysisChartEdit from '@/components/analysis/AnalysisChartEdit.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import type { PlotChart } from '@/lib/analysis'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { Legend, type ZoomHandler } from '@deltares/fews-web-oc-charts'
import {
  combineSvgParts,
  convertSvgElementToImageBitmap,
  createExportableSvgElement,
  fetchAndInlineCssAndFonts,
} from '@/lib/svg'
import { downloadImageBitmapAsPng } from '@/lib/download'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useConfigStore } from '@/stores/config'
import { toSnakeCase } from '@/lib/utils/toSnakeCase'

interface Props {
  chart: PlotChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  config: ChartConfig
}

const props = defineProps<Props>()
const chartRef = useTemplateRef('render-chart')
const legendRef = useTemplateRef('render-chart-legend')
const configStore = useConfigStore()

const renderingChart = ref(false)
const editing = ref(false)

async function downloadChartImage() {
  renderingChart.value = true

  // Wait two ticks to ensure the chart is rendered before we start downloading.
  await nextTick()
  await nextTick()

  if (!chartRef.value) return
  if (!legendRef.value) return

  const chartSvg = chartRef.value?.getSvgElement()
  if (!chartSvg) return

  const legend = new Legend(
    props.config.series.map((s) => ({
      selector: s.id,
      label: s.name,
    })),
    legendRef.value,
  )
  chartRef.value?.axisAccept(legend)
  const legendSvg = legendRef.value.children[0] as SVGSVGElement
  if (!legendSvg) return

  const legendSvgWithFont = createExportableSvgElement(
    legendSvg,
    `.legend-entry text {font-family: var(--font-family); font-size: 0.875rem;}`,
  )

  const parts = [legendSvgWithFont, chartSvg]

  const svg = combineSvgParts(parts)

  const styleSheet = await configStore.getCustomStyleSheet()
  const css = await fetchAndInlineCssAndFonts(styleSheet)

  // Create exportable SVG element with embedded style sheet.
  const exportSvg = createExportableSvgElement(svg, css)
  renderingChart.value = false

  // Convert SVG to bitmap, then download it as PNG.
  const targetSize: [number, number] = [1920, 1080]
  const bitmap = await convertSvgElementToImageBitmap(exportSvg, targetSize)

  await downloadImageBitmapAsPng(
    bitmap,
    `${toSnakeCase(props.chart.title)}.png`,
  )
}
</script>

<style scoped>
.render-chart-container {
  position: fixed;
  top: -9999px;
  left: -9999px;
}

.render-chart {
  width: 700px;
  height: 400px;
}
</style>
