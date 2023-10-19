<template>
  <div class="chart-with-chips">
    <div class="chart-controls">
      <v-chip-group column>
        <v-chip small v-for="tag in legendTags" :key="tag.id" @click="toggleLine(tag.id)" :outlined="tag.disabled">
          <div>
            <div style="margin-top:6px; margin-right: 5px;" v-html="tag.legendSvg"></div>
          </div>
          {{ tag.name }}
        </v-chip>
      </v-chip-group>
    </div>
    <div ref="elevation-chart-container" class="elevation-chart-container"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { CartesianAxesOptions, ChartLine, ChartMarker, WheelMode, toggleChartVisisbility} from '@deltares/fews-web-oc-charts'
import { AxisPosition, AxisType, CartesianAxes, MouseOver, ZoomHandler } from '@deltares/fews-web-oc-charts'
import { ChartConfig } from './lib/ChartConfig'
import { ChartSeries } from './lib/ChartSeries'
import { Series } from '@/lib/TimeSeries'
import { uniq } from 'lodash'
import { extent } from 'd3'
import { ScaleOptions } from '@deltares/fews-web-oc-charts/lib/types/Scale/scaleOptions'
import { CartesianAxisOptions } from '@deltares/fews-web-oc-charts/lib/types/Axis/cartesianAxisOptions'

interface Tag {
  id: string;
  name: string;
  disabled: boolean;
  legendSvg: string;
}

@Component
export default class ElevationChart extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  })
  value!: ChartConfig

  @Prop({
    default: () => {
      return {}
    }
  })
  series!: Record<string, Series>
  axis!: CartesianAxes
  isFullscreen = false
  legendTags: Tag[] = []

  created(): void {
    this.legendTags = []
  }

  mounted(): void {
    const axisOptions: CartesianAxesOptions = {
      x: [{
        type: AxisType.value,
        position: AxisPosition.Bottom,
        label: ' ',
        unit: ' ',
        nice: true,
        showGrid: true
      }],
      y: [{
        position: AxisPosition.Left,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true
      },
        {
          position: AxisPosition.Right,
          label: ' ',
          unit: ' ',
          nice: true
        }
      ],
      margin: {
        left: 80,
        right: 80
      }
    }

    this.setChartConfigValues(axisOptions)

    const containerReference = this.$refs['elevation-chart-container'] as HTMLElement
    this.axis = new CartesianAxes(containerReference, 800, 1200, axisOptions)
    const mouseOver = new MouseOver()
    const zoom = new ZoomHandler(WheelMode.X)
    this.axis.accept(zoom)
    this.axis.accept(mouseOver)
    this.resize()
    if (this.value !== undefined) this.onValueChange()
    window.addEventListener('resize', this.resize)
  }

  @Watch('series', { deep: true})
  @Watch('value')
  onValueChange(): void {
    this.clearChart()
    this.refreshChart()
    this.setTags()
    this.$forceUpdate()
  }

  beforeDestroy(): void {
    window.removeEventListener('resize', this.resize)
  }

  get fullscreenIcon(): string {
    return this.isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
  }

  setChartConfigValues(axisOptions: CartesianAxesOptions): void {
    const chartConfig = this.value
    const yAxisOptions = chartConfig.yAxis
    const xAxisOptions = chartConfig.xAxis

    yAxisOptions?.forEach((axis, i) => {
      axisOptions.y[i].type = axis.type as AxisType
    })

    xAxisOptions?.forEach((axis, i) => {
      axisOptions.x[i].type = axis.type as AxisType
    })
  }

  refreshChart(): void {
    const ids: string[] = this.axis.charts.map((c: any) => c.id)
    const removeIds: string[] = this.axis.charts.map((c: any) => c.id)
    if (this.value?.series === undefined) return
    for (const series of this.value.series) {
      if (!series.visibleInPlot) continue
      if (!ids.includes(series.id)) {
        this.addToChart(series)
      }
      const index = removeIds.findIndex((item) => {
        return item === series.id
      })
      if (index >= 0) removeIds.splice(index, 1)
    }
    for (const id of removeIds) {
      this.axis.removeChart(id)
    }

    let extraYAxisDrawOptions: ScaleOptions = {}
    const yAxis = this.value.yAxis as CartesianAxisOptions[]

    let extraXAxisDrawOptions: ScaleOptions = {}
    const xAxis = this.value.xAxis as CartesianAxisOptions[]

    if (yAxis || xAxis) {
      const x = xAxis ?? []
      const y = yAxis ?? []
      const cartOptions: CartesianAxesOptions = {x, y}
      this.axis.setOptions(cartOptions)

      if (yAxis.some(axis => axis.defaultDomain !== undefined)) {
        extraYAxisDrawOptions.nice = false
      }
      if (xAxis.some(axis => axis.defaultDomain !== undefined)) {
        extraXAxisDrawOptions.nice = false
      }
    }

    this.axis.redraw({
      x: {
        ...extraXAxisDrawOptions,
        autoScale: true
      },
      y: {
        ...extraYAxisDrawOptions,
        autoScale: true
      }
    })
  }

  clearChart(): void {
    this.axis.removeAllCharts()
  }

  setThresholdLines(): void {
    const thresholdLines = this.value?.thresholds
    if (thresholdLines === undefined) return

    const tag = this.legendTags.find(tag => {
      return tag.id === 'Thresholds'
    })

    let defaultDomain = extent(thresholdLines.map( l => l.value))

    this.axis.setOptions(
      {
        x: [
          { defaultDomain: defaultDomain as [number, number], nice: true },
        ],
        y: []
      }
    )
  }

  addToChart(chartSeries: ChartSeries): void {
    const id = chartSeries.id
    const series = this.series[chartSeries.dataResources[0]]
    const data = series?.data !== undefined ? series.data : []
    let line
    if (chartSeries.type === 'line') {
      line = new ChartLine(data, {
        tooltip: {toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`}
      })
    } else {
      line = new ChartMarker(data, {
        symbol: chartSeries.marker,
        tooltip: {toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`}
      })
    }
    line.addTo(
      this.axis, {
        x: {
          key: 'x',
          axisIndex: chartSeries.options.x.axisIndex
        },
        y: {
          key: 'y',
          axisIndex: chartSeries.options.y.axisIndex
        }
      }, id, chartSeries.style)
  }

  setTags(): void {
    const s = new XMLSerializer()
    const series = this.value?.series
    if (series === undefined) {
      this.legendTags = []
    } else {
      const ids = uniq(series.filter(s => s.visibleInLegend).map((s) => s.id))
      this.legendTags = ids.map((id) => {
        const { svgGroup, legendSvg }=createChip()
        for (const chart of this.axis.charts) {
          if (chart.id === id) {
            let node = chart.drawLegendSymbol(undefined, true)
            svgGroup.appendChild(node)
          }
        }
        legendSvg.appendChild(svgGroup)
        const name = series.find((s) => s.id === id)?.name || ''
        return {
          id: id,
          name: name || '',
          disabled: false,
          legendSvg: s.serializeToString(legendSvg)
        }
      })
    }

    function createChip() {
      const legendSvg=document.createElement('svg')
      legendSvg.setAttribute('width', '20')
      legendSvg.setAttribute('height', '20')
      legendSvg.setAttribute('viewBox', '0 0 20 20')
      const svgGroup=document.createElement('g')
      svgGroup.setAttribute('transform', 'translate(0 10)')
      return { svgGroup, legendSvg }
    }
  }

  toggleLine(id: string): void {
    const tag = this.legendTags.find(tag => {
      return tag.id === id
    })
    if (tag) {
      tag.disabled = !tag.disabled
    }

    toggleChartVisisbility(this.axis, id)
  }

  resize(): void {
    this.$nextTick(() => {
      this.axis.resize()
    })
  }
}
</script>

<style>

.elevation-chart-container {
  display: flex;
  position: relative;
  flex: 1 1 100px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

.chart-controls {
  display:flex;
  flex:0;
  margin: 0 50px;
}

.elevation-chart-container.hidden > svg {
  display: none;
}

.elevation-chart-container.fullscreen {
  max-height: none;
}

.chart-with-chips {
  display: flex;
  flex-direction: column;
  flex: 1 1 80%;
  height: 100%;
}

.v-chip--outlined {
  opacity: 0.5;
}

</style>
