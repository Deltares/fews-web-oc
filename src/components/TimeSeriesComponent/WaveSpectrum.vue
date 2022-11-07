<template>
  <div class="chart-with-chips">
    <div class="date-chip-container">
      <v-chip v-model="plotTime" small outlined>
        <v-icon small left>
          mdi-clock
        </v-icon>
        {{ dateString }}
      </v-chip>
    </div>
    <div ref="chart-container" class="chart-container" v-resize="resize"></div>
  </div>
</template>

<script lang="ts">
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'
import { ChartConfig } from './lib/ChartConfig'
import { ChartSeries } from './lib/ChartSeries'
import { Series } from '@/lib/TimeSeries'
import * as wbCharts from 'wb-charts'

export interface ChartStore {
  [key: string]: wbCharts.Chart;
}

@Component({
  components: {
    DateTimeSlider
  }
})
export default class WaveSpectrum extends Vue {
  @Prop({ default: () => { return {} } })
  value!: Partial<ChartConfig>

  @Prop({
    default: () => {
      return {}
    }
  })
  series!: Record<string, Series>

  @Prop({default: () => new Date('invalid')})
  time!: Date

  @Prop({default: false, type: Boolean})
  useNow!: boolean

  axis!: any // eslint-disable-line @typescript-eslint/no-explicit-any

  markGroup: ChartStore = {}
  dates: Date[] = []
  plotTime: Date = new Date('invalid')
  dateString: string = '--:--'
  dateTimer: any = 0

  mounted (): void {
    const axisOptions: wbCharts.PolarAxisOptions = {
      angular: {
        type: wbCharts.AxisType.degrees,
        direction: wbCharts.Direction.CLOCKWISE,
        intercept: Math.PI / 2
      },
      innerRadius: .2,
      margin: { left: 50, right: 50 }
    }
    const containerReference = this.$refs['chart-container'] as HTMLElement
    this.axis = new wbCharts.PolarAxis(containerReference, null, null, axisOptions)

    this.resize()
    this.setDates()
    if (this.value !== undefined) this.onValueChange()
    if (this.useNow) this.dateTimer = setInterval(this.setDateString, 60000)
    window.addEventListener('resize', this.resize)
  }

  beforeDestroy (): void {
    window.removeEventListener('resize', this.resize)
  }

  @Watch('value')
  onValueChange (): void {
    if (this.axis === undefined) return
    this.clearChart()
    this.refreshChart()
    this.$forceUpdate()
  }

  @Watch('series')
  onSeriesChange() {
    console.log('series update', this.series.length)
    this.setDates()
    this.onValueChange()
  }

  @Watch('useNow')
  onUseNowChange (): void {
    // 'value' or 'series' is not always changed when 'now' is used. Update manually.
    if (this.useNow) {
      this.dateTimer = setInterval(this.setDateString, 60000)
    } else {
      clearInterval(this.dateTimer)
    }
    this.onValueChange()
  }

  refreshChart (): void {
    const ids = Object.keys(this.markGroup)
    const removeIds = Object.keys(this.markGroup)
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
      delete this.markGroup[id]
    }
    this.axis.redraw()
  }

  clearChart (): void {
    this.axis?.removeAllCharts()
    this.markGroup = {}
  }

  addToChart (chartSeries: ChartSeries): void {
    const id = chartSeries.id
    switch (chartSeries.type) {
      case 'polarspectrum':
        this.markGroup[id] = new wbCharts.ChartRange(this.convertData(chartSeries, this.time), { colorScale: wbCharts.AUTO_SCALE, tooltip: {toolTipFormatter: this.toolTipFormatter, anchor: wbCharts.TooltipAnchor.Pointer} })
        break;
      default:
        throw new Error(`Chart series type '${chartSeries.type} is not supported.'`)
    }
    this.markGroup[id].addTo(this.axis, chartSeries.options as any, id, chartSeries.style)
  }

  convertData(chartSeries: ChartSeries, selectedTime: Date) {
    if (this.series === undefined) return []
    const dataSeries = this.series[chartSeries.dataResources[0]] as any
    if (dataSeries === undefined) return [{ x: [0, 0], y: [0, 0], v: null }]
    const frequencies: number[] = dataSeries.domains[0].domainAxisValues[0].values.map((v: string) => { return +v[0] })
    const directions: number[] = dataSeries.domains[0].domainAxisValues[1].values[0].map((v: string) => { return +v })
    const data = []
    const missingValue = dataSeries.header.missVal
    const t = dataSeries.domains.length - 1
    const events = dataSeries.domains[t].events[0]
    const values = events.values
    for (let f=0; f < frequencies.length; f++) {
      const f1 = f === 0 ? 0 : frequencies[f - 1]
      const f2 = frequencies[f + 1]
      for (let d = 0; d < directions.length; d++) {
        const direction = directions[d]
        const v = values[f][d]
        if (v !== missingValue) {
          data.push({ x: [f1, f2], y: [direction, direction + 10], v })
        }
      }
    }
    this.plotTime = new Date(`${events.date}T${events.time}Z`)
    this.setDateString()
    return data
  }

  setDateString() {
    this.dateString = !isNaN(this.plotTime.valueOf()) ? this.plotTime.toDateString() : ''
  }

  setDates() {
    const series = this.series[0]
    if (series === undefined || series.data === undefined) return
    this.dates = series?.data.map((datum: any) => datum.x)
    this.$emit('times', this.dates)
  }

  toolTipFormatter(d: any) {
    const aUnit = this.value.angularAxis ? this.value.angularAxis[0].unit : ''
    const rUnit = this.value.radialAxis ? this.value.radialAxis[0].unit : ''
    const vUnit = this.value.colorAxis ? this.value.colorAxis[0].unit : ''
    const decimals = 1
    const colorValue = d.v !== null ? d.v : '-'
    return `${colorValue} ${vUnit}<br>${d.y[0].toFixed(decimals)}${aUnit}–${d.y[1].toFixed(decimals)}${aUnit}<br>${d.x[0].toFixed(decimals)}–${d.x[1].toFixed(decimals)}&#8201;${rUnit} `
  }

  @Watch('time')
  setToCurrentTime() {
    this.onValueChange()
  }

  resize (): void {
    this.$nextTick(() => {
      this.axis.resize()
    })
  }

}
</script>


<style>
.chart-with-chips {
  display: flex;
  flex: 1 1 80%;
}

.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 100px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
  max-height: none;
}

.value-label {
  width: 50px;
  margin: 0px 10px;
  padding: 0px 10px;
  border-radius: 20px;
  text-align: center;
}

span.value-label .value-label {
  background-color: white;
}

.theme--dark .value-label {
  background-color: black;
}

.chart-container .data-field{
  text-anchor: middle;
}

.date-chip-container {
  display: flex;
  flex: 0;
  margin: auto;
}
</style>
