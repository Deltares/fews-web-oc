<i18n>
{
  "en": {
    "chart-title": "Title"
  },
  "nl": {
    "chart-title": "Titel"
  }
}
</i18n>

<template>
  <div class="configurable-chart" :class="{ fullscreen: isFullscreen }" :id="id">
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
      <v-spacer />
      {{ title }}
      <v-spacer />
      <v-btn icon @click="toggleFullscreen()" v-if="!isFullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
    </v-toolbar>
    <v-sheet fluid class="chart-with-chips">
      <div fluid :class="{'chart-with-legend': true }" >
        <div style="display:flex;flex:1 1; margin: 0 50px;">
        <v-chip-group column active-class="primary--text">
          <v-chip :close="seriesEditable" small v-for="tag in tags" :key="tag.id" @click="toggleLine(tag.id)" :disabled="tag.disabled">
            <div>
              <div style="margin-top:6px; margin-right: 5px;" v-html="tag.legendSvg"/>
            </div>
            {{ tag.name }}
          </v-chip>
        </v-chip-group>
        </div>
        <div ref="chart-container" class="chart-container" :class="{ fullscreen : isFullscreen }" v-resize="resize"></div>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as wbCharts from 'wb-charts'
import { ChartConfig, ChartSeries } from './lib/ChartConfig'
import { Series } from './lib/TimeSeries'
import { DateTime, Interval } from 'luxon'

interface Tag {
  id: string;
  name: string;
  disabled: boolean;
  legendSvg: string;
}

export interface ChartStore {
  [key: string]: wbCharts.Chart;
}

@Component
export default class ConfigurableChart extends Vue {
  @Prop()
  value!: ChartConfig

  @Prop()
  id!: string

  @Prop({ default: false })
  closable!: boolean

  @Prop({ default: true })
  seriesEditable!: boolean

  @Prop({ default: false })
  chartEditable!: boolean

  @Prop()
  series!: Record<string, Series>

  @Prop({ default: () => Interval.fromDateTimes(DateTime.local(), DateTime.local()) })
  period!: Interval

  @Prop({ default: () => { Date() } })
  lastUpdated!: Date

  @Prop({ default: () => [] })
  alertLines!: any

  // legendSvg = '<g></g>'
  numLines = 0
  showAlarmEdit = false
  alarmValue: number | null = null
  // FIXME: should be wbCharts.Axis depends on change in wbCharts
  axis!: any // eslint-disable-line @typescript-eslint/no-explicit-any
  isFullscreen = false
  tags!: Tag[]
  lines: ChartStore = {}
  alertLinesVisitor!: wbCharts.AlertLines

  created (): void {
    this.tags = []
  }

  mounted (): void {
    const axisOptions: wbCharts.CartesianAxesOptions = {
      x: [{ type: wbCharts.AxisType.time, position: wbCharts.AxisPosition.Bottom, showGrid: true }],
      y: [{ position: wbCharts.AxisPosition.Left, showGrid: true, label: ' ', unit: ' ', nice: true },
        { position: wbCharts.AxisPosition.Right, label: ' ', unit: ' ', nice: true }],
      margin: { left: 50, right: 50 }
    }

    const containerReference = this.$refs['chart-container'] as HTMLElement
    this.axis = new wbCharts.CartesianAxis(containerReference, null, null, axisOptions)
    const mouseOver = new wbCharts.MouseOver()
    const zoom = new wbCharts.ZoomHandler()
    const currentTime = new wbCharts.CurrentTime({ x: { axisIndex: 0 } })
    const dstIndicator = new wbCharts.DstIndicator({ x: { axisIndex: 0 } })

    this.alertLinesVisitor = new wbCharts.AlertLines(this.alertLines)
    this.axis.accept(zoom)
    this.axis.accept(this.alertLinesVisitor)
    this.axis.accept(mouseOver)
    this.axis.accept(currentTime)
    this.axis.accept(dstIndicator)
    this.resize()
    if (this.value !== undefined) this.onValueChange()
    window.addEventListener('resize', this.resize)
  }

  get title (): string {
    return this.value?.title !== undefined ? this.value.title : 'Title'
  }

  @Watch('lastUpdated')
  @Watch('value.lastUpdated')
  @Watch('alertLines')
  onValueChange (): void {
    this.clearChart()
    this.updateAlerts()
    this.refreshChart()
    this.setTags()
    this.$forceUpdate()
  }

  @Watch('period')
  onPeriodChange (): void {
    if (this.period !== undefined && this.period.isValid) {
      const domain: Date[] = [this.period.start.toJSDate(), this.period.end.toJSDate()]
      this.axis.setOptions({ x: [{ domain }] })
      this.axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
    }
  }

  beforeDestroy (): void {
    window.removeEventListener('resize', this.resize)
  }

  get fullscreenIcon (): string {
    return this.isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
  }

  updateAlerts (): void {
    this.alertLinesVisitor.options = this.alertLines
  }

  refreshChart (): void {
    const ids = Object.keys(this.lines)
    const removeIds = Object.keys(this.lines)
    if (this.value?.series === undefined) return
    for (const series of this.value.series) {
      if (!ids.includes(series.id)) {
        this.addToChart(series)
      }
      const index = removeIds.findIndex((item) => { return item === series.id })
      if (index >= 0) removeIds.splice(index, 1)
    }
    for (const id of removeIds) {
      this.axis.removeChart(id)
      delete this.lines[id]
    }
    if (this.value.yAxis) {
      this.axis.setOptions(
        {
          y: [
            this.value.yAxis[0],
            this.value.yAxis[1]
          ]
        }
      )
    }
    this.axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
  }

  clearChart (): void {
    this.axis.removeAllCharts()
    this.lines = {}
  }

  addToChart (chartSeries: ChartSeries): void {
    const id = chartSeries.id
    const series = this.series[chartSeries.dataResources[0]]
    const data = series?.data !== undefined ? series.data : []
    if (chartSeries.type === 'line') {
      this.lines[id] = new wbCharts.ChartLine(data, { toolTipFormatter: () => `${chartSeries.name}` })
    } else {
      this.lines[id] = new wbCharts.ChartMarker(data, { toolTipFormatter: () => `${chartSeries.name}` })
    }
    this.lines[id].addTo(
      this.axis,
      {
        x: { key: 'x', axisIndex: 0 },
        y: { key: 'y', axisIndex: chartSeries.options.y.axisIndex }
      }, id, chartSeries.style)
  }

  setTags (): void {
    const s = new XMLSerializer()
    if (this.value?.series === undefined) {
      this.tags = []
    } else {
      this.tags = this.value?.series.map((series) => {
        const chart = this.lines[series.id]
        return {
          id: series.id,
          name: series.name,
          disabled: false,
          legendSvg: s.serializeToString(chart.drawLegendSymbol(undefined, false))
        }
      })
    }
  }

  toggleFullscreen (): void {
    this.isFullscreen = !this.isFullscreen
    this.$nextTick(() => {
      this.axis.resize()
    })
  }

  toggleLine (id: string): void {
    const tag = this.tags.find(tag => { return tag.id === id })
    const visible = wbCharts.toggleChartVisisbility(this.axis, id)
    if (tag) {
      tag.disabled = !visible
    }
  }

  removeTag (tag: Tag): void {
    this.$emit('remove-series', [tag.id])
  }

  resize (): void {
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
  padding: 0px;
}

.fullscreen {
  position: fixed;
  top: 0px;
  right: 0px;
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
  padding: 0px;
  /* background: #1E1E1E; */
}

.chart-with-legend {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0px auto;
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
