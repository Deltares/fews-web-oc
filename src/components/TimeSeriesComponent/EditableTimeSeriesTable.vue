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

        <template v-slot:[`item.value`]="{ item }">
          <v-text-field
            v-model="item.value"
            single-line
            solo
            dense
            flat
            reverse
            hide-details="true"
            height=24
          >
            {{ item.value }}
          </v-text-field>
        </template>

        <template v-slot:[`item.flag`]="{ item }">
          <v-select
            v-model="item.flag"
            single-line
            solo
            dense
            flat
            hide-details="true"
            height=24
            :items="flagIds"
          >
            {{ item.flag }}
          </v-select>
        </template>

        <template v-slot:[`item.flagSource`]="{ item }">
          <v-select
            v-model="item.flagSource"
            single-line
            solo
            dense
            flat
            hide-details="true"
            height=24
            :items="flagSourceIds"
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
          >
            {{ item.comment }}
          </v-text-field>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
        <v-icon
          small
          class="mr-2"
          @click="editItem(item)"
        >
          mdi-pencil
        </v-icon>
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

const fewsPropertyModule = namespace('fewsProperties')

@Component({})
export default class EditableTimeSeriesTable extends Vue {

  @fewsPropertyModule.Getter('getFlags')
    flags!: TimeSeriesFlag[]
  @fewsPropertyModule.Getter('getFlagSources')
    flagSources!: TimeSeriesFlagSource[]

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
  editEvent: any = {
    date: '',
    value: 0,
    flag: 0,
    flagSource: undefined,
    comment: undefined,
    user: undefined
  }
  defaultEvent: any = {
    date: this.$i18n.d(new Date(), 'datatable'),
    value: 0,
    flag: 0,
    flagSource: undefined,
    comment: undefined,
    user: undefined
  }

  editTableData: Record<string, unknown>[] = []
  tableHeaders: TableHeaders[] = []

  mounted() {
    this.onSeriesIdChange()
  }

  @Watch('seriesId')
  onSeriesIdChange() {
    this.tableHeaders = createEditTableHeaders(this.value.series, this.seriesId)
    this.editTableData = createEditTableData(this.tableData, this.seriesId)
  }

  onSave() {
    this.stopEdit()
  }

  stopEdit() {
    this.$emit('close')
  }

  editItem (item: any) {
    this.editIndex = this.tableData.indexOf(item)
    this.editEvent = Object.assign({}, item)
    this.dialog = true
  }

  get formTitle(): string {
    return this.editIndex === -1 ? 'New event' : 'Edit event'
  }

  get flagIds(): string[] {
    return this.flags.map(flag => flag.flag)
  }

  get flagSourceIds(): (string | null)[] {
    return this.flagSources.map(flagSource => flagSource.id)
  }
}

</script>

<style>
.data-table.edit{
  max-height: 700px;
}
</style>
