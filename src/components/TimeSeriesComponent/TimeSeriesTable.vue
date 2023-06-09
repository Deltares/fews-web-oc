<template>
  <div class="table-container">
    <v-dialog
      persistent
      v-model="editDialog"
    >
      <EditableTimeSeriesTable :value="value" :series="series" :seriesId="editSeriesId" :tableData="tableData" @close="closeEditDialog" @update="onDataUpdate"></EditableTimeSeriesTable>
    </v-dialog>
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
          <div class="table-header-indicator-text">
            <span style="display: flex; margin:auto 0; flex: 2 1 auto; justify-self: flex-end;">
              {{ h.text }}
            </span>
            <v-btn v-if="h.editable"
              tile
              icon
              depressed
              x-small
              @click="editTimeSeries(h.value)"
            >
              <v-icon small>mdi-pencil-outline</v-icon>
            </v-btn>
          </div>
          <div class="table-header-indicator-color" :style="{'background-color': h.color}"></div>
        </div>
      </template>
      <template v-for="id in seriesIds" v-slot:[`item.${id}`]="{ item }">
        <td
        :key="`${id}-${item.date}`"
        >
          <v-tooltip
            top
            max-width="200px"
            open-delay="250"
          >
            <template v-slot:activator="{ on, attrs }">
              <div style="display: flex; justify-content: flex-start;"
              v-bind="attrs"
              v-on="on">
                <span style="display: flex; margin:auto 0; flex: 2 1 50%; justify-content: end; min-width: 50%;">
                  <div style="display: flex; flex: 0 0 auto; width: 16px;">
                    <v-icon
                      v-show="item[id].flag > 0"
                      x-small
                      :color="getFlagColor(item[id].flag)"
                    >
                      mdi-circle
                    </v-icon>
                  </div>
                  {{ item[id].y }}
                </span>
                <div style="display: flex; flex: 0 0 auto; width: 16px;">
                  <v-icon
                    v-if="item[id].comment !== undefined"
                    small
                  >
                    mdi-comment-outline
                  </v-icon>
                </div>
              </div>
            </template>
            <div v-show="item[id].flag !== undefined">
              <v-icon>mdi-flag-variant</v-icon> {{ getFlagName(item[id].flag) }}
            </div>
            <div v-show="item[id].flagSource !== undefined">
              <v-icon>mdi-access-point</v-icon> {{ getFlagSourceName(item[id].flagSource) }}
            </div>
            <div v-show="item[id].user !== undefined">
              <v-icon>mdi-account</v-icon> {{ item[id].user }}
            </div>
            <div v-show="item[id].comment !== undefined">
              <v-icon>mdi-comment</v-icon> {{ item[id].comment }}
            </div>
          </v-tooltip>
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type {ChartConfig} from '@/components/TimeSeriesComponent/lib/ChartConfig'
import {Series} from '@/lib/TimeSeries'
import type {TimeSeriesFlag, TimeSeriesFlagSource} from '@deltares/fews-pi-requests';
import {getUniqueSeriesIds} from "@/components/TimeSeriesComponent/lib/getUniqueSeriesIds";
import type {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
import {createTableHeaders} from "@/components/TimeSeriesComponent/lib/createTableHeaders";
import {createTableData} from '@/components/TimeSeriesComponent/lib/createTableData';
import EditableTimeSeriesTable from '@/components/TimeSeriesComponent/EditableTimeSeriesTable.vue'

const fewsPropertyModule = namespace('fewsProperties')

@Component({
  components: {
    EditableTimeSeriesTable,
  },
})
export default class TimeSeriesTable extends Vue {

  @fewsPropertyModule.Getter('getFlags')
    flags!: TimeSeriesFlag[]
  @fewsPropertyModule.Getter('getFlagSources')
    flagSources!: TimeSeriesFlagSource[]
  @fewsPropertyModule.Getter('getFlagColorByFlag')
    getFlagColor!: (flag: number) => string | undefined
  @fewsPropertyModule.Getter('getFlagNameByFlag')
    getFlagName!: (flag: number) => string
  @fewsPropertyModule.Getter('getFlagSourceNameByFlag')
    getFlagSourceName!: (flag: number) => string
  @fewsPropertyModule.Action('loadFlags')
    loadFlags!: () => Promise<void>
  @fewsPropertyModule.Action('loadFlagSources')
    loadFlagSources!: () => Promise<void>

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

  editDialog: boolean = false
  editSeriesId: string = ''
  editTableData: Record<string, unknown>[] = []
  editTableHeaders: TableHeaders[] = []

  async mounted(): Promise<void> {
    await this.loadFlags()
    await this.loadFlagSources()
    this.onSeriesChange()
  }

  @Watch('series', {deep: true})
  onSeriesChange(): void {
    this.seriesIds = getUniqueSeriesIds(this.value.series)
    this.tableHeaders = createTableHeaders(this.value.series, this.seriesIds)
    this.tableData = createTableData(this.value.series, this.series, this.seriesIds)
  }

  editTimeSeries(seriesId: string) {
    this.editDialog = true
    this.editSeriesId = seriesId
  }

  closeEditDialog() {
    this.editDialog = false
  }

  onDataUpdate(newData: Record<string, any>) {
    this.$emit('update', newData)
    console.log('onDataUpdate in TimeSeriesTable')
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

.v-data-table--dense > .v-data-table__wrapper > table > thead > tr > th {
  height: 100% !important;
  min-height: 32px;
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
  flex-direction: column;
  justify-content: flex-end;
}

.table-header-indicator-text {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex: 2 0 auto;
}

.table-header-indicator-color {
  flex: 0 0 10px;
  width: 100%;
}
</style>
