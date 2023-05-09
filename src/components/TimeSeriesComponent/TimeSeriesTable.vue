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
      mobile-breakpoint="0"
    >
    <template v-for="h in tableHeaders" v-slot:[`header.${h.value}`]>
        <div class="table-header-indicator" :key="h.value">
          <span class="table-header-indicator-text">{{ h.text }}</span>
          <div class="table-header-indicator-color" :style="{'background-color': h.color}"></div>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'
import {ChartConfig} from './lib/ChartConfig'
import {ChartSeries} from './lib/ChartSeries'
import {Series} from '@/lib/TimeSeries'
import { uniq } from 'lodash'
import { DataTableHeader } from 'vuetify'

interface TableHeaders extends DataTableHeader {
  color?: string;
}

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

  seriesIds: string[] = []

  dateTimes: Date[] = []

  tableData: Record<string, unknown>[] = []
  tableHeaders: TableHeaders[] = []

  mounted() {
    this.onSeriesChange()
  }

  setSeriesIds() {
    // Some ChartSeries appear twice in the ChartConfig; once for a line and once for a marker.
    // Only one of these has to be included in the table.
    this.seriesIds = []
    if (this.value?.series === undefined) return
    this.seriesIds = uniq(this.value.series.filter(series => series.visibleInTable).map((series) => series.id))
  }

  setHeaders() {
    if (this.value?.series === undefined) return
    const tableHeaders: TableHeaders[] = []
    tableHeaders.push({value: 'date', text: 'Date', width: '200px', class: 'sticky-column', cellClass:'sticky-column'})
    const seriesDef = this.value.series
    this.seriesIds.forEach((seriesId) => {
      const chartSeries = seriesDef.find((s) => s.id === seriesId)
      if (chartSeries !== undefined) {
        tableHeaders.push({ value: chartSeries.id, text: this.formatHeader(chartSeries), color: chartSeries.style.stroke?.toString()})
      }
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
    this.tableData = this.dateTimes.map((date: Date) => {
      const event: any = {}
      event.date = date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      })
      for (const seriesId of this.seriesIds) {
        const chartSeries = seriesDef.find((s) => s.id === seriesId)
        if (chartSeries === undefined) continue
        const series = this.series[chartSeries.dataResources[0]]
        if (series === undefined) {
          event[chartSeries.id] = null
        } else {
          const data = series.data ?? []
          const selected = data.find((dataPoint: {x: Date, y: number}) => date.getTime() === dataPoint.x.getTime())
          event[chartSeries.id] = selected !== undefined ? selected.y : null
        }
      }
      return event
    })
  }

  formatHeader(chartSeries: ChartSeries): string {
    const label = chartSeries.name ?? ''
    const header = label
    return header
  }

  @Watch('series')
  onSeriesChange (): void {
    this.setSeriesIds()
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

.sticky-column {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
}
.v-data-table--fixed-header > .v-data-table__wrapper > table > thead > tr > th.sticky-column {
  z-index: 3;
}

.theme--dark .sticky-column {
  background-color: #1E1E1E;
}

.theme--light .sticky-column {
  background-color: white;
}

.table-header-indicator {
  display: flex;
  height: 100%;
  flex-direction: column
}

.table-header-indicator-text {
  flex-grow: 1;
}

.table-header-indicator-color {
  flex: 0 0 10px;
  width: 100%;
  margin-bottom: 5px;
}
</style>
