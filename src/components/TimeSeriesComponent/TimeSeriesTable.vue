<template>
  <div class="table-container">
    <v-data-table class="data-table"
      :headers="tableHeaders"
      :items="tableData"
      :items-per-page="-1"
      dense
      disable-filtering
      disable-pagination
      disable-sort
      fixed-header
      hide-default-footer
    ></v-data-table>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'
import {ChartConfig} from './lib/ChartConfig'
import {ChartSeries} from './lib/ChartSeries'
import {Series} from '@/lib/TimeSeries'

@Component
export default class TimeSeriesTable extends Vue {
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

  dateTimes: Date[] = []

  tableData: Record<string, unknown>[] = []
  tableHeaders: {value: string, text: string, sortable: boolean}[] = []

  mounted() {
    this.setHeaders()
    this.setDates()
    this.combineEvents()
  }

  setHeaders() {
    if (this.value?.series === undefined) return
    const tableHeaders: {value: string, text: string, sortable: boolean}[] = []
    tableHeaders.push({value: 'date', text: 'Date', sortable: true})
    this.value.series.forEach((chartSeries) => {
      tableHeaders.push({value: chartSeries.id, text: this.formatHeader(chartSeries), sortable: false})
    })
    this.tableHeaders = tableHeaders
  }

  setDates() {
    if (this.value?.series === undefined) {
      this.dateTimes = []
      return
    }
    const dates: Date[] = []
    for (const chartSeries of this.value.series) {
      const series = this.series[chartSeries.dataResources[0]]
      if (series !== undefined) {
        for (const event of series.data) {
          if (dates.findIndex(date => {return date.getTime() === event.x.getTime()}) === -1) {
            dates.push(event.x)
          }
        }
      }
    }
    dates.sort((a, b) => {return a.getTime() - b.getTime()})
    this.dateTimes = dates
  }

  combineEvents() {
    if (this.value?.series === undefined) return
    const seriesDef = this.value.series
    this.tableData = this.dateTimes.map((date: Date, index: number) => {
      const event: any = {}
      event.date = date.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false})
      for (const chartSeries of seriesDef) {
        const series = this.series[chartSeries.dataResources[0]]
        if (series === undefined) {
          event[chartSeries.id] = null
        } else {
          const data = series.data[index] ?? []
          event[chartSeries.id] = data.y
        }
      }
      return event
    })
  }

  formatHeader(chartSeries: ChartSeries): string {
    const label = chartSeries.name ?? ''
    const header = chartSeries.unit !== undefined ? `${label} [${chartSeries.unit}]` : label
    return header
  }

  @Watch('series')
  onSeriesChange (): void {
    this.setHeaders()
    this.setDates()
    this.combineEvents()
  }
}
</script>

<style>
.table-container {
  display: flex;
  flex: 1 1 100%;
  width: 100%;
  height: 100%;
}

.data-table {
  display: flex;
  position: relative;
  flex: 1 1 100px;
  flex-direction: column;
  width: 100%;
  height: 100%;
  fill: currentColor;
  margin: auto;
  overflow-y: hidden;
}

.data-table.hidden > svg {
  display: none;
}

.data-table.fullscreen {
  max-height: none;
}

.v-data-table__wrapper {
  width: 100%;
}
</style>
