<template>
  <div class="table-container">
    <v-data-table class="data-table"
      :headers="tableHeaders"
      :items="tableData"
      :items-per-page="-1"
      item-key="date"
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
      <template v-for="id in seriesIds" v-slot:[`item.${id}`]="{ item }">
        <td
          :key="`${id}-${item.date}`"
        >
          <div style="display: flex; justify-content: flex-start;">
            <span style="display: flex; margin:auto 0; flex: 2 1 50%; justify-content: end; min-width: 50%;">
              {{ item[id].value }}
            </span>
            <div style="display: flex; flex: 0 0 auto; width: 16px;">
              <v-tooltip top max-width="200px">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    v-show="item[id].flag > 0"
                    small
                    v-bind="attrs"
                    v-on="on"
                    :color="getFlagColor(item[id].flag)"
                  >
                    mdi-flag-variant-outline
                  </v-icon>
                </template>
                <div>
                  <v-icon>mdi-flag-variant</v-icon> {{ flagLabels[item[id].flag] }}
                </div>
                <div v-if="item[id].flagSource !== undefined">
                  <v-icon>mdi-access-point</v-icon> {{ item[id].flagSource }}
                </div>
              </v-tooltip>
            </div>
            <div style="display: flex; flex: 0 0 auto; width: 16px;">
              <v-tooltip top max-width="200px">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    v-if="item[id].comment !== undefined"
                    small
                    v-bind="attrs"
                    v-on="on"
                  >
                    mdi-comment-outline
                  </v-icon>
                </template>
                <div>
                  <v-icon>mdi-account</v-icon> {{ item[id].user }}
                </div>
                <div>
                  <v-icon>mdi-comment</v-icon> {{ item[id].comment }}
                </div>
              </v-tooltip>
            </div>
          </div>
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import type {ChartConfig} from '@/components/TimeSeriesComponent/lib/ChartConfig'
import {Series} from '@/lib/TimeSeries'
import {getUniqueSeriesIds} from "@/components/TimeSeriesComponent/lib/getUniqueSeriesIds";
import type {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
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

  // TODO: Remove this. This should be an enum which we should get back from fews.
  flagLabels: string[] = ["original reliable", "corrected reliable", "completed reliable", "original doubtful", "corrected doubtful", "completed doubtful", "original unreliable", "corrected unreliable", "completed unreliable", "original missing", "deleted", "set original reliable", "set original unreliable", "archive missing"]

  mounted() {
    this.onSeriesChange()
  }

  @Watch('series', {deep: true})
  onSeriesChange(): void {
    this.seriesIds = getUniqueSeriesIds(this.value.series)
    this.tableHeaders = createTableHeaders(this.value.series, this.seriesIds)
    this.tableData = createTableData(this.value.series, this.series, this.seriesIds)
  }

  getFlagColor(flag: number): string {
    if (flag === 0) return 'none'
    return 'red'
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
