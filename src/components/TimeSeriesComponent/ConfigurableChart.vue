<template>
  <div class="configurable-chart" :class="{ fullscreen: isFullscreen }">
    <v-btn
      v-if="isFullscreen"
      fab
      small
      right
      absolute
      @click="toggleFullscreen()"
    >
      <v-icon>mdi-fullscreen-exit</v-icon>
    </v-btn>
    <v-toolbar :color="$vuetify.theme.dark ? '#1E1E1E' : '#FFFFFF'" dense flat style="flex-grow:0">
      <v-spacer/>
      {{ value.title }}
      <v-spacer/>
      <v-btn icon @click="toggleFullscreen()" v-if="!isFullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
    </v-toolbar>
    <v-sheet fluid class="chart-with-chips">
      <div fluid :class="{'chart-with-legend': true }">
        <div style="display:flex;flex:1 1; margin: 0 50px;">
          <v-chip-group column active-class="primary--text">
            <v-chip small v-for="tag in legendTags" :key="tag.id" @click="toggleLine(tag.id)" :disabled="tag.disabled">
              <div>
                <div style="margin-top:6px; margin-right: 5px;" v-html="tag.legendSvg"/>
              </div>
              {{ tag.name }}
            </v-chip>
          </v-chip-group>
        </div>
        <div ref="chart-container" class="chart-container" :class="{ fullscreen : isFullscreen }"
             v-resize="resize"></div>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'
import * as wbCharts from 'wb-charts'
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
  legendTags!: Tag[]

  created(): void {
    this.legendTags = []
  }

  mounted(): void {
    const axisOptions: wbCharts.CartesianAxesOptions = {
      x: [{
        type: wbCharts.AxisType.time,
        position: wbCharts.AxisPosition.Bottom,
        showGrid: true
      }],
      y: [{
        position: wbCharts.AxisPosition.Left,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true
      },
        {
          position: wbCharts.AxisPosition.Right,
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
    this.axis = new wbCharts.CartesianAxis(containerReference, null, null, axisOptions)
    const mouseOver = new wbCharts.MouseOver()
    const zoom = new wbCharts.ZoomHandler()
    const currentTime = new wbCharts.CurrentTime({
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
      line = new wbCharts.ChartLine(data, {
        tooltip: {toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`}
      })
    } else {
      line = new wbCharts.ChartMarker(data, {
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
      const ids = uniq(series.map((s) => s.id))
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

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen
    this.$nextTick(() => {
      this.axis.resize()
    })
  }

  toggleLine(id: string): void {
    const tag = this.legendTags.find(tag => {
      return tag.id === id
    })
    const visible = wbCharts.toggleChartVisisbility(this.axis, id)
    if (tag) {
      tag.disabled = !visible
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
.configurable-chart {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  padding: 0;
}

.fullscreen {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 9000;
}

.chart-with-chips {
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 100px;
  padding: 0;
  /* background: #1E1E1E; */
}

.chart-with-legend {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}

.chart-legend {
  position: relative;
  width: 100%;
  fill: currentColor;
}

.chart-container.fullscreen {
  max-height: none;
}

.chart-container {
  display: flex;
  position: relative;
  flex-basis: 500px;
  max-height: 400px;
  flex-grow: 4;
  flex-shrink: 1;
  width: 100%;
  fill: currentColor;
}
</style>
