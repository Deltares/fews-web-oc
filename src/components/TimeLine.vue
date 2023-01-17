<template>
  <div v-resize="resize" class="timeline-container">
    <div ref="chart-container" class="timeline-chart"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as d3 from 'd3'
import * as wbCharts from 'wb-charts'

export interface ChartStore {
  [key: string]: wbCharts.Chart
}

export interface ChartData {
  [key: string]: number | string | Date
}

@Component
export default class TimeLine extends Vue {
  @Prop({ default: () => [] })
  data!: ChartData[]

  @Prop()
  id!: string

  @Prop({ default: '' })
  xkey!: string

  @Prop({ default: '' })
  ykey!: string

  @Prop({ default: false })
  reload!: boolean

  @Prop()
  domain!: [number, number]

  @Prop({ default: '' })
  xlabel!: string

  @Prop({ default: '' })
  ylabel!: string

  @Prop({ default: '' })
  startDate!: string

  @Prop({ default: '' })
  endDate!: string

  @Prop({
    default: () => d3.scaleOrdinal(d3.schemeTableau10),
  })
  colormap!: any

  // legendSvg = '<g></g>'
  numLines = 0
  showAlarmEdit = false
  alarmValue: number | null = null
  // FIXME: should be wbCharts.Axis depends on change in wbCharts
  axis!: any // eslint-disable-line @typescript-eslint/no-explicit-any
  isFullscreen = false
  lines: ChartStore = {}
  charts!: wbCharts.Chart
  percentage: string | number = ''
  delta: number = 0

  mounted() {
    const hourFormat = new Intl.DateTimeFormat(
              'nl-NL',
              {
              hour: 'numeric',
              minute: 'numeric',
              }
            ).format

    const axisOptions: wbCharts.CartesianAxesOptions = {
      margin: { top: 50, left: 50, right: 50, bottom: 40 },
      x: [
        {
          type: wbCharts.AxisType.time,
          position: wbCharts.AxisPosition.Bottom,
          domain: [new Date('2022-12-14'), new Date('2022-12-22')],
        },
      ],
      y: [{ type: wbCharts.AxisType.time,
          domain: [new Date('1970-01-01 00:00:01'), new Date('1970-01-01 23:59:59')],
          showGrid: true,
          format: hourFormat
      }],
    }

    const currentTime = new wbCharts.CurrentTime({
      x: {
        axisIndex: 0
      }
    })
    const dstIndicator = new wbCharts.DstIndicator({x: { axisIndex: 0}})
    const containerReference = this.$refs['chart-container'] as HTMLElement
    this.axis = new wbCharts.CartesianAxis(
      containerReference,
      null,
      null,
      axisOptions
    )

    currentTime.visit(this.axis)
    dstIndicator.visit(this.axis)

    this.charts = new wbCharts.ChartRange([], {
      colorScale: wbCharts.AUTO_SCALE,
      tooltip: {
        toolTipFormatter: (d: any) => {
          let formattedString = ''
          const formattedDate = new Intl.DateTimeFormat('nl-NL').format(
            d.date[0]
          )
          const formattedValue = d.workflowId
          if (this.delta < 23 * 60 * 60 * 1000) {
            const options: Intl.DateTimeFormatOptions = {
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            }
            const formattedTime = new Intl.DateTimeFormat(
              'nl-NL',
              options
            ).format(d.dispatchTime)
            const timeString = formattedTime
            formattedString = `${timeString}<br/>${formattedDate}</br>${formattedValue}`
          } else {
            formattedString = `${formattedDate}</br>${formattedValue}`
          }
          return formattedString
        },
      },
    })

    this.charts.addTo(
      this.axis,
      {
        x: { key: 'x', axisIndex: 0 },
        y: { key: 'y', axisIndex: 0 },
        color: { key: 'color' },
      },
      'matrix',
      {}
    )

    this.onValueChange()
  }

  @Watch('data')
  onValueChange() {
    this.refreshChart()
    this.$forceUpdate()
  }

  get fullscreenIcon() {
    return this.isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
  }

  refreshChart() {
    this.charts.data = this.data
    this.charts.setAxisIndex({
      x: { key: this.xkey, axisIndex: 0 },
      y: { key: this.ykey, axisIndex: 0 },
    })
    this.axis.setOptions({
      x: [
        {
          label: this.xlabel,
        },
      ],
      y: [
        {
          label: this.ylabel,
        },
      ],
    })
    console.log('redraw')
    console.log(this.data)
    this.axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
  }

  clearChart() {
    this.axis.removeAllCharts()
    this.lines = {}
  }

  resize() {
    this.$nextTick(() => {
      this.axis.resize()
    })
  }
}
</script>

<style>
.timeline-container {
  width: 100%;
  font-size: 12px;
}

.chart-with-chips {
  flex-direction: column;
}

.timeline-chart {
  position: relative;
  height: 500px;
  width: 100%;
  fill: white;
}
</style>
