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
    <TimeSeriesChart
      v-if="renderingChart"
      ref="render-chart"
      class="render-chart"
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
import {
  convertSvgElementToImageBitmap,
  createExportableSvgElement,
} from '@/lib/svg'
import { downloadImageBitmapAsPng } from '@/lib/download'
import { nextTick, ref, useTemplateRef } from 'vue'

interface Props {
  chart: PlotChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  config: ChartConfig
}

defineProps<Props>()
const chartRef = useTemplateRef('render-chart')

const renderingChart = ref(false)
const editing = ref(false)

async function downloadChartImage() {
  renderingChart.value = true
  await nextTick()
  const chart = chartRef.value
  const svg = chart?.getSvgElement()
  if (!svg) {
    throw new Error('Could not obtain SVG element for chart.')
  }
  // Get print and font style sheet contents and concatenate them into a
  // self-contained complete stylesheet for exporting the SVG.
  const getCssContents = async (file: string): Promise<string> => {
    const baseUrl = import.meta.env.BASE_URL || ''
    const response = await fetch(`${baseUrl}${file}`, {
      headers: {
        'Content-Type': 'text/css',
      },
    })
    return response.text()
  }
  const cssContents = await Promise.all(
    ['weboc-default-style.css', 'default-styles.css', 'rwsos-style.css'].map(
      getCssContents,
    ),
  )
  const finalCssContents = cssContents.join('')

  const response = await fetch('/fonts/RO/ROsanswebtextregular.woff');
  const blob = await response.blob();
  const reader = new FileReader();

  const css = await new Promise((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as any).split(',')[1];
      const css = `@font-face {
        font-family: 'RO-Sans';
        src: url('data:font/woff;charset=utf-8;base64,${base64}') format('woff');
        font-weight: normal;
        font-style: normal;
      }`;
      resolve(css);
    };
    reader.readAsDataURL(blob);
  })

  // Create exportable SVG element with embedded style sheet.
  const exportSvg = createExportableSvgElement(svg, finalCssContents + css)
  renderingChart.value = false

  // Convert SVG to bitmap, then download it as PNG.
  const targetSize: [number, number] = [1920, 1080]
  const bitmap = await convertSvgElementToImageBitmap(exportSvg, targetSize)

  await downloadImageBitmapAsPng(bitmap, 'chart.png')

}
</script>

<style scoped>
.render-chart {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 700px;
  height: 400px;
}
</style>
