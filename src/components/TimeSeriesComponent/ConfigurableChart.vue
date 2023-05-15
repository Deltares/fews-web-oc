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
    <div ref="chart-container" class="chart-container"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { AlertLines, CartesianAxesOptions, ChartLine, ChartMarker, WheelMode, toggleChartVisisbility} from '@deltares/fews-web-oc-charts'
import { AxisPosition, AxisType, CartesianAxes, CurrentTime, MouseOver, ZoomHandler } from '@deltares/fews-web-oc-charts'
import { ChartConfig } from './lib/ChartConfig'
import { ChartSeries } from './lib/ChartSeries'
import { ThresholdLine } from './lib/ThresholdLine'
import { Series } from '@/lib/TimeSeries'
import { uniq } from 'lodash'
import { extent } from 'd3'

interface Tag {
  id: string;
  name: string;
  disabled: boolean;
  legendSvg: string;
}

@Component
export default class ConfigurableChart extends Vue {
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
  thresholdLines: ThresholdLine[] = []
  thresholdLinesVisitor!: AlertLines

  axis!: any // eslint-disable-line @typescript-eslint/no-explicit-any
  isFullscreen = false
  legendTags: Tag[] = []

  created(): void {
    this.legendTags = []
  }

  mounted(): void {
    const axisOptions: CartesianAxesOptions = {
      x: [{
        type: AxisType.time,
        position: AxisPosition.Bottom,
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

    const containerReference = this.$refs['chart-container'] as HTMLElement
    this.axis = new CartesianAxes(containerReference, null, null, axisOptions)
    const mouseOver = new MouseOver()
    const zoom = new ZoomHandler(WheelMode.X)
    const currentTime = new CurrentTime({
      x: {
        axisIndex: 0
      }
    })

    this.thresholdLinesVisitor = new AlertLines(this.thresholdLines)

    this.axis.accept(this.thresholdLinesVisitor)
    this.axis.accept(zoom)
    this.axis.accept(mouseOver)
    this.axis.accept(currentTime)
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
    if (this.value.yAxis) {
      this.axis.setOptions({
        y: [
          this.value.yAxis[0],
          this.value.yAxis[1]
        ]
      })
    }

    this.setThresholdLines()

    this.axis.redraw({
      x: {
        autoScale: true
      },
      y: {
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

    const disabled = tag?.disabled ?? false
    if (disabled){
      this.thresholdLines = []
    } else {
      this.thresholdLines = thresholdLines
    }

    let defaultDomain = extent(thresholdLines.map( l => l.value))
    if ( this.thresholdLines.length === 0 ){
      defaultDomain = [NaN, NaN]
    }

    this.axis.setOptions(
      {
        y: [
          { defaultDomain: defaultDomain, nice: true },
        ]
      }
    )
    this.thresholdLinesVisitor.options = this.thresholdLines
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
          axisIndex: 0
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
    const thresholds = this.value?.thresholds
    if (thresholds !== undefined) {
      const { svgGroup, legendSvg }=createChip()
      legendSvg.appendChild(svgGroup)
      const thresholdLegend = {
        id: 'Thresholds',
        name: 'Thresholds',
        disabled: false,
        legendSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21Z"/></svg>'
      }
      this.legendTags.push(thresholdLegend)
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

    if (id === 'Thresholds'){
      this.setThresholdLines()
      this.axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
    } else{
      toggleChartVisisbility(this.axis, id)
    }
  }


  resize(): void {
    this.$nextTick(() => {
      this.axis.resize()
    })
  }
}
</script>

<style>

.chart-container {
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

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
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
