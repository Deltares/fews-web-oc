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
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import {ChartConfig} from './lib/ChartConfig'
import {ChartSeries} from './lib/ChartSeries'
import {Series} from '@/lib/TimeSeries'
import {getUniqueSeriesIds} from "@/components/TimeSeriesComponent/lib/getUniqueSeriesIds";
import {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
import {createTableHeaders} from "@/components/TimeSeriesComponent/lib/createTableHeaders";
import {createTableData} from './lib/createTableData';

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
  tableData: Record<string, unknown>[] = []
  tableHeaders: TableHeaders[] = []

  mounted() {
    this.onSeriesChange()
  }

  @Watch('series', {deep: true})
  onSeriesChange(): void {
    this.seriesIds = getUniqueSeriesIds(this.value.series)

    this.tableHeaders = createTableHeaders(this.value.series, this.seriesIds)
    this.tableData = createTableData(this.value.series, this.series, this.seriesIds)
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
