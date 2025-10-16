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
      :panHandler
      :settings="settings.charts.timeSeriesChart"
      @update:x-domain="updateDomain"
    />
    <!-- Used to render the chart for downloading as image. -->
    <!-- This is done to have the same chart size across different devices. -->
    <div v-if="renderingChart" class="render-chart-container">
      <div ref="render-chart-legend" />
      <TimeSeriesChart
        ref="render-chart"
        class="render-chart"
        :config="renderConfig"
        :series
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
import {
  Legend,
  type ZoomHandler,
  type PanHandler,
} from '@deltares/fews-web-oc-charts'
import {
  combineSvgParts,
  convertSvgElementToImage,
  createExportableSvgElement,
} from '@/lib/svg'
import { downloadImageAsPng } from '@/lib/download'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useConfigStore } from '@/stores/config'
import { toSnakeCase } from '@/lib/utils/toSnakeCase'
import { fetchAndInlineCssAndFonts } from '@/lib/css'
import { getSeriesByLegend } from '@/lib/legend'
import { getSubplotWithDomain } from '@/lib/display'
import { UpdateDomainEmits } from '@/lib/charts/domain'

interface Props {
  chart: PlotChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  settings: ComponentSettings
  config: ChartConfig
}

const props = defineProps<Props>()
const chartRef = useTemplateRef('render-chart')
const legendRef = useTemplateRef('render-chart-legend')
const configStore = useConfigStore()

const renderingChart = ref(false)
const editing = ref(false)

const emit = defineEmits<UpdateDomainEmits>()

const renderDomain = ref<[Date, Date]>()
function updateDomain(domain: [Date, Date]) {
  renderDomain.value = domain
  emit('update:x-domain', domain)
}

const renderConfig = computed(() =>
  getSubplotWithDomain(props.config, renderDomain.value),
)

async function downloadChartImage() {
  renderingChart.value = true

  // Wait two ticks to ensure the chart is rendered before we start downloading.
  // For some reason one tick is not enough sometimes.
  await nextTick()
  await nextTick()

  if (!chartRef.value) return
  if (!legendRef.value) return

  const chartSvg = chartRef.value.getSvgElement()
  if (!chartSvg) return

  const seriesByLegend = getSeriesByLegend(props.config.series)
  // In case of multiple series with the same label, we only show the
  // legend for the first series.
  const series = Object.values(seriesByLegend).map((s) => s[0])

  const legend = new Legend(
    series.map((s) => ({
      selector: s.id,
      label: s.name,
    })),
    legendRef.value,
  )
  chartRef.value.axisAccept(legend)
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
  const image = await convertSvgElementToImage(exportSvg, targetSize)

  await downloadImageAsPng(image, `${toSnakeCase(props.chart.title)}.png`)
}
</script>

<style scoped>
.render-chart-container {
  visibility: hidden;
  position: fixed;
}

.render-chart {
  width: 700px;
  height: 400px;
}
</style>
