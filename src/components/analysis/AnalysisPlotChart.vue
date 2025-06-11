<template>
  <AnalysisChartCard
    :chart="chart"
    v-bind="$attrs"
    @edit="editing = true"
    @save-as-image="downloadChartImage"
  >
    <TimeSeriesChart
      ref="chart"
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
    />
    <AnalysisChartEdit v-model="editing" :chart />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import AnalysisChartEdit from '@/components/analysis/AnalysisChartEdit.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import type { PlotChart } from '@/lib/analysis'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { useTemplateRef, ref, computed } from 'vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import {
  convertSvgElementToImageBitmap,
  createExportableSvgElement,
} from '@/lib/svg'
import { downloadImageBitmapAsPng } from '@/lib/download'

interface Props {
  chart: PlotChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  config: ChartConfig
}

defineProps<Props>()

const config = computed(() =>
  timeSeriesDisplayToChartConfig(props.subplot, props.domain),
)
const editing = ref(false)
const chartRef = useTemplateRef('chart')

async function downloadChartImage() {
  const chart = chartRef.value
  const svg = chart?.getSvgElement()
  if (!svg) {
    throw new Error('Could not obtain SVG element for chart.')
  }

  // Get print and font style sheet contents and concatenate them into a
  // self-contained complete stylesheet for exporting the SVG.
  const getCssContents = async (file: string): Promise<string> => {
    const response = await fetch(new URL(file, import.meta.env.BASE_URL))
    return response.text()
  }
  const cssContents = await Promise.all(
    ['weboc-default-style.css'].map(getCssContents),
  )
  const finalCssContents = cssContents.join('')

  // Create exportable SVG element with embedded style sheet.
  const exportSvg = createExportableSvgElement(svg, finalCssContents)

  // Convert SVG to bitmap, then download it as PNG.
  const targetSize: [number, number] = [1920, 1080]
  const bitmap = await convertSvgElementToImageBitmap(exportSvg, targetSize)

  await downloadImageBitmapAsPng(bitmap, 'chart.png')
}
</script>
