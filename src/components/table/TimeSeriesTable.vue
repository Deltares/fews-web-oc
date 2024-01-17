<template>
  <div class="table-container">
    <v-tooltip v-model="tooltip" :activator="activator" :key="activator">
      <TableTooltip v-bind="tooltipItem">/</TableTooltip>
    </v-tooltip>
    <v-data-table
      class="data-table"
      :headers="tableHeaders as any"
      :items="tableData"
      items-per-page="100"
      density="compact"
      no-filter
      fixed-header
      height="100%"
    >
      <template v-slot:headers="{ columns }">
        <tr>
          <template v-for="column in columns" :key="column.key">
            <th
              :style="{ minWidth: column.minWidth }"
              :class="[
                (column as TableHeaders).class,
                {
                  'table-header--editing': isEditingTimeSeries(
                    column.key as string,
                  ),
                },
              ]"
            >
              <div class="table-header-indicator">
                <div class="table-header-indicator-text">
                  <span>{{ column.title }}</span>
                  <template v-if="(column as TableHeaders).editable">
                    <div
                      v-if="isEditingTimeSeries(column.key as string)"
                      class="table-header__actions"
                    >
                      <v-btn
                        prepend-icon="mdi-content-save-outline"
                        @click="save(column.key as string)"
                        :disabled="newTableData.length === 0"
                        color="primary"
                        variant="flat"
                        size="small"
                        class="mr-5 my-2"
                        >Save</v-btn
                      >
                      <v-btn
                        size="small"
                        variant="flat"
                        class="my-2"
                        @click="stopEditTimeSeries(column.key || '')"
                        >Cancel</v-btn
                      >
                    </div>
                    <v-btn
                      v-else
                      size="x-small"
                      variant="text"
                      icon="mdi-pencil"
                      @click="toggleEditTimeSeries(column.key as string)"
                    ></v-btn>
                  </template>
                </div>
                <div
                  class="table-header-indicator-color"
                  :style="{
                    'background-color': (column as TableHeaders).color,
                  }"
                ></div>
              </div>
            </th>
          </template>
        </tr>
      </template>
      <template v-slot:item.date="{ item }">
        <span class="sticky-column">{{ dateFormatter.format(item.date) }}</span>
      </template>
      <template v-for="id in seriesIds" v-slot:[`item.${id}`]="{ item }">
        <!-- Table cell when editing data -->
        <TableCellEdit
          v-if="
            isEditing &&
            editedSeriesIds.length > 0 &&
            editedSeriesIds.includes(id)
          "
          :id="id"
          :item="item"
          @update:item="(event) => onUpdateItem(event)"
        ></TableCellEdit>
        <!-- Table cell when not editing data. Shows additional info about flags. -->
        <TableCell
          v-else
          :id="id"
          :item="item"
          @mouseenter="(event) => showTooltip(event, item[id])"
          @mouseleave="(event) => hideTooltip(event)"
        ></TableCell>
      </template>
      <!-- hide footer -->
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import TableTooltip from './TableTooltip.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { getUniqueSeriesIds } from '@/lib/charts/getUniqueSeriesIds'
import type { TableHeaders } from '@/lib/table/types/TableHeaders'
import { createTableHeaders } from '@/lib/table/createTableHeaders'
import {
  type TableSeriesData,
  dateFormatter,
  createTableData,
  tableDataToTimeSeries,
} from '@/lib/table/tableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import { onBeforeMount } from 'vue'
import TableCellEdit from '@/components/table/TableCellEdit.vue'
import TableCell from '@/components/table/TableCell.vue'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      series: [],
    }
  },
  series: () => {
    return {}
  },
})

const emit = defineEmits(['change'])

const store = useFewsPropertiesStore()

const seriesIds = ref<string[]>([])
const tooltip = ref<boolean>(false)
const tooltipItem = ref<any>({})
const activator = ref<string>('')
const tableData = ref<Record<string, Partial<TableSeriesData> | Date>[]>([])
const newTableData = ref<Record<string, Partial<TableSeriesData> | Date>[]>([])
const tableHeaders = ref<TableHeaders[]>([])

const isEditing = ref<boolean>(false)
const editedSeriesIds = ref<string[]>([])

onBeforeMount(() => {
  if (props.config !== undefined) {
    seriesIds.value = getUniqueSeriesIds(props.config.series)
    tableHeaders.value = createTableHeaders(
      props.config.series,
      seriesIds.value,
    )
  }

  store.loadFlags().then(() => {
    store.setFlagQualities()
    if (props.config !== undefined) {
      tableData.value = createTableData(
        props.config.series,
        props.series,
        seriesIds.value,
      )
    }
  })
  store.loadFlagSources()
})

watch(props.config, () => {
  if (props.config === undefined) return
  seriesIds.value = getUniqueSeriesIds(props.config.series)
  tableHeaders.value = createTableHeaders(props.config.series, seriesIds.value)
})

watchDebounced(
  props.series,
  () => {
    if (props.series === undefined) return
    tableData.value = createTableData(
      props.config.series,
      props.series,
      seriesIds.value,
    )
  },
  { debounce: 500, maxWait: 1000 },
)

const showTooltip = (event: any, item: any) => {
  if (!item.tooltip) return
  const id = 'tooltip' + Math.random().toString(16).slice(2)
  const element = event.target
  element.id = id
  activator.value = `#${id}`
  tooltip.value = true
  tooltipItem.value = {
    flag: item.flag,
    flagName: store.getFlagName(item.flag),
    flagSource: store.getFlagSourceName(item.flagSource),
    user: item.user,
    comment: item.comment,
  }
}

const hideTooltip = (event: any) => {
  const element = event.target
  element.id = null
  activator.value = ''
  tooltip.value = false
}

function stopEdit() {
  isEditing.value = false
  editedSeriesIds.value = []
  newTableData.value = []
}

function save(seriesId: string) {
  const newTimeSeriesData = tableDataToTimeSeries(newTableData.value, [
    seriesId,
  ])
  emit('change', newTimeSeriesData)
  stopEditTimeSeries(seriesId)
}

function toggleEditTimeSeries(seriesId: string) {
  if (isEditingTimeSeries(seriesId)) {
    stopEditTimeSeries(seriesId)
  } else {
    editTimeSeries(seriesId)
  }
}

function editTimeSeries(seriesId: string) {
  isEditing.value = true
  if (seriesId !== null) editedSeriesIds.value.push(seriesId)
}

function stopEditTimeSeries(seriesId: string) {
  const index = editedSeriesIds.value.indexOf(seriesId)
  if (index > -1) {
    editedSeriesIds.value.splice(index, 1)
    if (editedSeriesIds.value.length === 0) stopEdit()
    else {
      for (let i = newTableData.value.length - 1; i >= 0; i--) {
        if (newTableData.value[i][seriesId] !== undefined) {
          delete newTableData.value[i][seriesId]
          if (Object.keys(newTableData.value[i]).length === 1) {
            newTableData.value.splice(i, 1)
          }
        }
      }
    }
  }
}

function isEditingTimeSeries(seriesId: string) {
  if (seriesId === null) return false
  return editedSeriesIds.value.includes(seriesId)
}

function onUpdateItem(event: Record<string, Partial<TableSeriesData> | Date>) {
  const index = newTableData.value.findIndex((item) => item.date === event.date)
  if (index > -1) {
    newTableData.value[index] = { ...newTableData.value[index], ...event }
  } else {
    newTableData.value.push(event)
  }
}
</script>

<style scoped>
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

.v-table__wrapper {
  width: 100%;
}

th.sticky-column {
  position: sticky;
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  left: 0;
}

.v-table--fixed-header
  > .v-table__wrapper
  > table
  > thead
  > tr
  > th.sticky-column {
  z-index: 3;
}

.table-header {
  vertical-align: bottom;
  height: inherit !important;
  max-width: 150px;
}

.table-header-indicator {
  display: flex;
  min-height: calc(var(--v-table-header-height) - 16px) !important;
  flex-direction: column;
}

.table-header-indicator-text {
  flex-grow: 1;
}

.table-header-indicator-color {
  flex: 0 0 10px;
  width: 100%;
  margin-bottom: 5px;
}

.table-header__actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
</style>

<style>
td:has(span.sticky-column) {
  position: sticky;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-theme--light td:has(div.table-cell-editable) {
  background: repeating-linear-gradient(
    45deg,
    rgb(var(--v-theme-surface)) 0px,
    rgb(var(--v-theme-surface)) 12.73px,
    rgb(240, 240, 240) 12.73px,
    rgb(240, 240, 240) 25.46px
  );
}

.v-theme--dark td:has(div.table-cell-editable) {
  background: repeating-linear-gradient(
    45deg,
    rgb(var(--v-theme-surface)) 0px,
    rgb(var(--v-theme-surface)) 12.73px,
    rgba(15, 15, 15) 12.73px,
    rgba(15, 15, 15) 25.46px
  );
}
</style>
