<template>
  <v-card>
    <v-toolbar dense flat>
      <v-toolbar-title>
        Edit data
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        @click="onSave()"
      >
        Save
        <v-icon>
          mdi-content-save-outline
        </v-icon>
      </v-btn>
      <v-btn
        @click="stopEdit()"
      >
        Cancel
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>
    <div class="table-container">
      <v-data-table class="data-table edit"
        v-model="selectedItems"
        :headers="tableHeaders"
        :items="editTableData"
        :items-per-page="-1"
        item-key="date"
        dense
        disable-filtering
        disable-pagination
        disable-sort
        hide-default-footer
        fixed-header
        show-select
        mobile-breakpoint="0"
      >
        <template v-for="h in tableHeaders" v-slot:[`header.${h.value}`]>
          <div class="table-header-indicator" :key="h.value">
            <div class="table-header-indicator-text">
              <span style="display: flex; margin:auto 0; flex: 2 1 auto; justify-self: flex-end;">
                {{ h.text }}
              </span>
            </div>
            <div class="table-header-indicator-color" :style="{'background-color': h.color}"></div>
          </div>
        </template>

        <template v-slot:[`item.y`]="{ item }">
          <v-text-field
            :value="item.y"
            single-line
            solo
            dense
            flat
            reverse
            hide-details="true"
            height=24
            @change="editValue(item, $event)"
          >
            {{ item.y }}
          </v-text-field>
        </template>

        <template v-slot:[`item.flagQuality`]="{ item }">
          <v-select
            v-model="item.flagQuality"
            single-line
            solo
            dense
            flat
            hide-details="true"
            height=24
            :items="flagQualities"
            @change="editFlagQuality(item, $event)"
          >
          </v-select>
        </template>

        <template v-slot:[`item.comment`]="{ item }">
          <v-text-field
            v-model="item.comment"
            single-line
            solo
            dense
            flat
            reverse
            hide-details="true"
            height=24
            @change="editItem(item)"
          >
            {{ item.comment }}
          </v-text-field>
        </template>
      </v-data-table>
    </div>
  </v-card>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type {ChartConfig} from '@/components/TimeSeriesComponent/lib/ChartConfig'
import {Series} from '@/lib/TimeSeries'
import type {TimeSeriesFlag, TimeSeriesFlagSource} from '@deltares/fews-pi-requests';
import type {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
import {createEditTableHeaders} from "@/components/TimeSeriesComponent/lib/createTableHeaders";
import {createEditTableData} from '@/components/TimeSeriesComponent/lib/createTableData';
import type {EditTableItem} from '@/components/TimeSeriesComponent/lib/createTableData';
import { uniq } from 'lodash'

const fewsPropertyModule = namespace('fewsProperties')

@Component({})
export default class EditableTimeSeriesTable extends Vue {

  @fewsPropertyModule.Getter('getFlags')
    flags!: Record<string,TimeSeriesFlag>
  @fewsPropertyModule.Getter('getFlagSources')
    flagSources!: Record<string,TimeSeriesFlagSource>

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

  @Prop({ default: ''})
  seriesId!: string

  @Prop({
    default: () => {
      return []
    }
  })
  tableData!: Record<string, unknown>[]

  dialog: boolean = false
  editIndex: number = -1
  editDate: Date = new Date()
  editedEvents: Record<string, EditTableItem> = {}
  defaultEvent: EditTableItem = {
    date: this.$i18n.d(new Date(), 'datatable'),
    y: null,
    flagOrigin: "COMPLETED",
    flagQuality: "RELIABLE",
    comment: undefined,
    user: undefined
  }

  editTableData: EditTableItem[] = []
  selectedItems: EditTableItem[] = []
  tableHeaders: TableHeaders[] = []
  flagQualities: TimeSeriesFlag['quality'][] = []

  mounted() {
    this.updateTableData()
  }

  @Watch('seriesId')
  @Watch('series', { deep: true})
  @Watch('tableData', { deep: true})
  updateTableData() {
    this.setFlagQualities()
    this.tableHeaders = createEditTableHeaders(this.value.series, this.seriesId)
    this.editTableData = createEditTableData(this.tableData, this.seriesId, this.flags)
  }

  onSave() {
    this.$emit('update',this.editedEvents)
    this.stopEdit()
  }

  stopEdit() {
    this.editTableData = createEditTableData(this.tableData, this.seriesId, this.flags)
    this.editedEvents = {}
    this.$emit('close')
  }

  editValue (item: EditTableItem, value: number | null) {
    if (item.y === null) {
      // User adds new value
      item.flagOrigin = "COMPLETED"
      item.flagQuality = "RELIABLE"
    } else {
      // User changes existing value
      item.flagOrigin = "CORRECTED"
    }
    item.y = value
    item.valueSource = "MAN"
    this.editItem(item)
  }

  editFlagQuality (item: EditTableItem, value: TimeSeriesFlag['quality']) {
    item.flagQuality = value
    item.flagSource = "MAN"
    this.editItem(item)
  }

  editItem (item: EditTableItem) {
    Vue.set(this.editedEvents, item.date, item)
    this.dialog = true
  }

  getFlagOrigin(flagId: string) {
    if (flagId === undefined) return
    return this.flags[flagId].source
  }

  setFlagQualities () {
    const origins: TimeSeriesFlag['quality'][] = []
    for (const flagId in this.flags) {
      origins.push(this.flags[flagId].quality)
    }
    this.flagQualities = uniq(origins)
  }

  get formTitle(): string {
    return this.editIndex === -1 ? 'New event' : 'Edit event'
  }

  get flagIds(): string[] {
    return Object.keys(this.flags)
  }
}

</script>

<style>
.data-table.edit{
  max-height: 700px;
}
</style>
