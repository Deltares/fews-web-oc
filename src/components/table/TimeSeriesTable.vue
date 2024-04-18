<template>
  <div class="table-container">
    <v-tooltip v-model="tooltip" :activator="activator" :key="activator">
      <TableTooltip v-bind="tooltipItem">/</TableTooltip>
    </v-tooltip>
    <v-data-table
      class="data-table"
      :headers="tableHeaders"
      :items="tableData"
      :expanded="expanded"
      :items-per-page-options="itemsPerPageOptions"
      items-per-page="200"
      item-value="date"
      density="compact"
      no-filter
      fixed-header
      height="100%"
    >
      <template v-slot:headers="{ columns }">
        <tr>
          <template v-for="(column, index) in columns" :key="column.key">
            <th
              :style="{ minWidth: column.minWidth }"
              :class="[
                (column as unknown as TableHeaders).class,
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
                  <div
                    v-if="
                      index === 0 &&
                      selected !== undefined &&
                      equidistantSeries.length < config.series.length
                    "
                    class="table-header__actions"
                  >
                    <v-btn
                      icon="mdi-table-row-plus-before"
                      @click="addRowToTimeSeries(selected, 'before')"
                      color="primary"
                      variant="text"
                      density="compact"
                    />
                    <v-btn
                      icon="mdi-table-row-plus-after"
                      @click="addRowToTimeSeries(selected, 'after')"
                      color="primary"
                      variant="text"
                      density="compact"
                    />
                  </div>
                  <template
                    v-if="
                      (column as unknown as TableHeaders).editable &&
                      !readOnlyMode
                    "
                  >
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
                    'background-color': (column as unknown as TableHeaders)
                      .color,
                  }"
                ></div>
              </div>
            </th>
          </template>
        </tr>
      </template>
      <template #item="{ item }">
        <tr
          :class="{ highlighted: selected?.date === item.date }"
          @click="(e) => handleRowClick(e, item)"
        >
          <td class="sticky-column">
            <v-text-field
              v-if="isEditing && item.isNewRow"
              :modelValue="toISOString(item.date)"
              @blur="item.date = new Date($event.target.value)"
              hide-details
              class="table-cell-editable"
              density="compact"
              variant="plain"
              type="datetime-local"
            />
            <div v-else>
              {{ dateFormatter.format(item.date) }}
            </div>
          </td>
          <td v-for="id in seriesIds">
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
            />
            <!-- Table cell when not editing data. Shows additional info about flags. -->
            <TableCell
              v-else
              :id="id"
              :item="item"
              @mouseenter="(event) => showTooltip(event, item[id])"
              @mouseleave="(event) => hideTooltip(event)"
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import TableTooltip from './TableTooltip.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { getUniqueSeriesIds } from '@/lib/charts/getUniqueSeriesIds'
import type { TableHeaders } from '@/lib/table/types/TableHeaders'
import { createTableHeaders } from '@/lib/table/createTableHeaders'
import {
  dateFormatter,
  createTableData,
  tableDataToTimeSeries,
  TableData,
} from '@/lib/table/tableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import { useConfigStore } from '@/stores/config'
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

const itemsPerPageOptions = [
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: 200, title: '200' },
  { value: 500, title: '500' },
  { value: -1, title: '$vuetify.dataFooter.itemsPerPageAll' },
]

const emit = defineEmits(['change', 'update:isEditing'])

const store = useFewsPropertiesStore()
const configStore = useConfigStore()
const readOnlyMode = ref<boolean>(configStore.general.readonlyMode ?? false)

const seriesIds = ref<string[]>([])
const tooltip = ref<boolean>(false)
const tooltipItem = ref<any>({})
const activator = ref<string>('')
const selected = ref<TableData>()
const tableData = ref<TableData[]>([])
const newTableData = ref<TableData[]>([])
const tableHeaders = ref<TableHeaders[]>([])

const isEditing = ref<boolean>(false)
const editedSeriesIds = ref<string[]>([])

const equidistantSeries = computed(() => {
  return Object.entries(props.series)
    .filter(([_, series]) =>
      series.header.timeStep !== undefined && 'unit' in series.header.timeStep
        ? series.header.timeStep?.unit !== 'nonEquidistant'
        : true,
    )
    .map(([id]) => id)
})

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

watch(isEditing, (value) => {
  emit('update:isEditing', value)
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

function toISOString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function getMidpointOfDates(d1: Date, d2: Date) {
  const result =
    d1.getTime() > d2.getTime()
      ? new Date(d1.getTime() - (d1.getTime() - d2.getTime()) / 2)
      : new Date(d1.getTime() + (d2.getTime() - d1.getTime()) / 2)
  result.setSeconds(0, 0)
  return result
}

function addMinuteToDate(d: Date) {
  d.setMinutes(d.getMinutes() + 1)
  return d
}

function indexIsInRange(index: number) {
  return index >= 0 && index < tableData.value.length
}

function addRowToTimeSeries(row: TableData, position: 'before' | 'after') {
  const index = tableData.value.findIndex((item) => item.date === row.date)
  const siblingIndex = position === 'before' ? index - 1 : index + 1

  const newDate = indexIsInRange(siblingIndex)
    ? getMidpointOfDates(row.date, tableData.value[siblingIndex].date)
    : addMinuteToDate(row.date)

  const newRow: TableData = {
    date: newDate,
    isNewRow: {},
  }
  editedSeriesIds.value.forEach((id) => {
    if (equidistantSeries.value.includes(id)) return

    newRow[id] = row[id]
  })

  isEditing.value = false
  tableData.value.splice(index + (position === 'before' ? 0 : 1), 0, newRow)
  nextTick(() => (isEditing.value = true))

  newTableData.value.push(newRow)
}

function handleRowClick(e: any, item: any) {
  if (['INPUT', 'SELECT'].includes(e.target.tagName) || !isEditing.value) return

  if (selected.value?.date === item.date) {
    clearSelected()
  } else {
    selected.value = item
  }
}

function clearSelected() {
  selected.value = undefined
}

watch(editedSeriesIds, () => {
  if (editedSeriesIds.value.length === 0) {
    clearSelected()
  }
})

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

  // Filter out new rows that were not saved
  tableData.value = tableData.value.filter((item) => !item.isNewRow)
}

function isEditingTimeSeries(seriesId: string) {
  if (seriesId === null) return false
  return editedSeriesIds.value.includes(seriesId)
}

function onUpdateItem(event: TableData) {
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

:deep(input[type='datetime-local']) {
  padding-top: 0;
  margin-left: -3px;
  font-size: 14px;
  letter-spacing: initial;
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

td.sticky-column {
  position: sticky;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-table--fixed-header
  > .v-table__wrapper
  > table
  > thead
  > tr
  > th.sticky-column {
  z-index: 3;
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

tr {
  background-color: rgb(var(--v-theme-surface));
}

tr.highlighted > td:first-child {
  border-left: 2px solid rgba(var(--v-theme-primary)) !important;
}
tr.highlighted > td:first-child > div {
  margin-left: -2px;
}

tr.highlighted > td:last-child {
  border-right: 2px solid rgb(var(--v-theme-primary)) !important;
}

tr.highlighted:first-child > td {
  border-top: 2px solid rgb(var(--v-theme-primary)) !important;
}

tr.highlighted > td,
tr:has(+ .highlighted) > td {
  border-bottom: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
