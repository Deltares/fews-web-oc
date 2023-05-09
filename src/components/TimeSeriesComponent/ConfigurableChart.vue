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
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'
import * as webOcCharts from '@deltares/fews-web-oc-charts'
import {ChartConfig} from './lib/ChartConfig'
import {ChartSeries} from './lib/ChartSeries'
import {Series} from '@/lib/TimeSeries'
import {uniq} from 'lodash';

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

  axis!: any // eslint-disable-line @typescript-eslint/no-explicit-any
  isFullscreen = false
  legendTags: Tag[] = []

  created(): void {
    this.legendTags = []
  }

  mounted(): void {
    const axisOptions: webOcCharts.CartesianAxesOptions = {
      x: [{
        type: webOcCharts.AxisType.time,
        position: webOcCharts.AxisPosition.Bottom,
        showGrid: true
      }],
      y: [{
        position: webOcCharts.AxisPosition.Left,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true
      },
        {
          position: webOcCharts.AxisPosition.Right,
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
    this.axis = new webOcCharts.CartesianAxes(containerReference, null, null, axisOptions)
    const mouseOver = new webOcCharts.MouseOver()
    const zoom = new webOcCharts.ZoomHandler()
    const currentTime = new webOcCharts.CurrentTime({
      x: {
        axisIndex: 0
      }
    })

    this.axis.accept(zoom)
    this.axis.accept(mouseOver)
    this.axis.accept(currentTime)
    this.resize()
    if (this.value !== undefined) this.onValueChange()
    window.addEventListener('resize', this.resize)
  }

  @Watch('series')
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

  addToChart(chartSeries: ChartSeries): void {
    const id = chartSeries.id
    const series = this.series[chartSeries.dataResources[0]]
    const data = series?.data !== undefined ? series.data : []
    let line
    if (chartSeries.type === 'line') {
      line = new webOcCharts.ChartLine(data, {
        tooltip: {toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`}
      })
    } else {
      line = new webOcCharts.ChartMarker(data, {
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
        const legendSvg = document.createElement('svg')
        legendSvg.setAttribute('width', '20')
        legendSvg.setAttribute('height', '20')
        legendSvg.setAttribute('viewBox', '0 0 20 20')
        const svgGroup = document.createElement('g')
        svgGroup.setAttribute('transform', 'translate(0 10)')
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
  }

  toggleLine(id: string): void {
    const tag = this.legendTags.find(tag => {
      return tag.id === id
    })
    webOcCharts.toggleChartVisisbility(this.axis, id)
    if (tag) {
      tag.disabled = !tag.disabled
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
