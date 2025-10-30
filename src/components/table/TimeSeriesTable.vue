<template>
  <div class="table-container">
    <v-tooltip v-model="tooltip" :activator="activator" :key="activator">
      <TableTooltip v-bind="tooltipItem">/</TableTooltip>
    </v-tooltip>
    <v-data-table
      class="data-table"
      :headers="tableHeaders"
      :items="tableData"
      :expanded="editedSeriesIds"
      :items-per-page-options="itemsPerPageOptions"
      :loading="isWaitingForTableUpdate"
      v-model:sortBy="sortBy"
      items-per-page="200"
      item-value="date"
      density="compact"
      no-filter
      fixed-header
      height="100%"
    >
      <template v-slot:headers="{ columns, toggleSort, isSorted, getSortIcon }">
        <tr>
          <template v-for="column in columns" :key="column.key">
            <th
              v-if="column.key === 'date'"
              class="table-header table-date sticky-column"
              :class="{
                'v-data-table__th--sorted': isSorted(column),
                'v-data-table__th--sortable': column.sortable && !isEditing,
              }"
              @click="
                column.sortable && !isEditing ? toggleSort(column) : undefined
              "
            >
              <div class="table-header-indicator-text">
                <span>{{ column.title }}</span>
                <v-icon
                  v-if="column.sortable && !isEditing"
                  class="v-data-table-header__sort-icon"
                  :icon="getSortIcon(column)"
                />
                <div
                  v-if="isEditing && nonEquidistantSeries.length > 0"
                  class="table-header__actions"
                >
                  <v-btn
                    icon="mdi-table-row-plus-before"
                    @click="addRowToTimeSeries(selected, 'before')"
                    color="primary"
                    variant="text"
                    density="compact"
                    :disabled="rowAdditionDisabled"
                  />
                  <v-btn
                    icon="mdi-table-row-plus-after"
                    @click="addRowToTimeSeries(selected, 'after')"
                    color="primary"
                    variant="text"
                    density="compact"
                    :disabled="rowAdditionDisabled"
                  />
                  <v-tooltip
                    v-if="rowAdditionDisabled"
                    activator="parent"
                    text="First select a row"
                    location="bottom"
                  />
                </div>
              </div>
              <div class="table-header-indicator-color"></div>
            </th>
            <th
              v-else
              class="table-header"
              :class="{
                'table-header--editing': isEditingTimeSeries(
                  column.key as string,
                ),
              }"
            >
              <div class="table-header-indicator">
                <div class="table-header-indicator-text">
                  <span>{{ column.title }}</span>
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
          <td class="table-date sticky-column">
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
              v-if="isEditing && canEditItem(item, id)"
              :id="id"
              :item="item"
              @update:item="(event) => onUpdateItem(event)"
            />
            <!-- Table cell when not editing data. Shows additional info about flags. -->
            <TableCell
              v-else
              :id="id"
              :item="item"
              @mouseenter="(event: MouseEvent) => showTooltip(event, item[id])"
              @mouseleave="(event: MouseEvent) => hideTooltip(event)"
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  type TableData,
  TableSeriesData,
} from '@/lib/table/tableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import { useConfigStore } from '@/stores/config'
import { onBeforeMount } from 'vue'
import TableCellEdit from '@/components/table/TableCellEdit.vue'
import TableCell from '@/components/table/TableCell.vue'
import {
  getDateWithMinutesOffset,
  getMidpointOfDates,
  toISOString,
} from '@/lib/date'
import { type ChartsSettings } from '@/lib/topology/componentSettings'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesTable']
  isLoading: boolean
}

const props = defineProps<Props>()

const itemsPerPageOptions = [
  { value: 200, title: '200' },
  { value: 500, title: '500' },
  { value: 1000, title: '1000' },
  { value: 2000, title: '2000' },
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

const nonEquidistantSeries = computed(() => {
  return Object.entries(props.series)
    .filter(([_, series]) =>
      series.header.timeStep !== undefined && 'unit' in series.header.timeStep
        ? series.header.timeStep?.unit.toLowerCase() === 'nonequidistant'
        : false,
    )
    .map(([id]) => id)
})

const dateOrder = computed(() =>
  props.settings.sortDateTimeColumn === 'ascending' ? 'asc' : 'desc',
)
type SortItem = { key: string; order: 'asc' | 'desc' }
const sortBy = ref<SortItem[]>([
  {
    key: 'date',
    order: dateOrder.value,
  },
])
watch(
  dateOrder,
  (order) => {
    const dateSortItem = sortBy.value.find((item) => item.key === 'date')
    if (!dateSortItem) return

    dateSortItem.order = order
  },
  { immediate: true },
)

onBeforeMount(() => {
  if (props.config !== undefined) {
    seriesIds.value = getUniqueSeriesIds(props.config.series)
    tableHeaders.value = createTableHeaders(
      props.config.series,
      seriesIds.value,
      props.settings.allowDateTimeSorting,
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

watch(
  () => props.config,
  () => {
    if (props.config === undefined) return
    seriesIds.value = getUniqueSeriesIds(props.config.series)
    tableHeaders.value = createTableHeaders(
      props.config.series,
      seriesIds.value,
      props.settings.allowDateTimeSorting,
    )
  },
)

// We debounce the table update, so even though loading the time series may have
// finished, updating the table items may not. Keep the loading indicator until
// the table items have been updated.
const isWaitingForTableUpdate = ref(true)
watch(
  () => props.isLoading,
  () => (isWaitingForTableUpdate.value = true),
)
watchDebounced(
  // We cannot use a getter on props.series directly here, since it is not
  // reassigned, but instead its contents are modified. We also do not want to
  // use a deep watcher, because it would watch the entire contents of the
  // series for changes, which is rather inefficient. Instead, we watch an array
  // of last updated dates.
  () => Object.values(props.series).map((series) => series.lastUpdated),
  () => {
    if (props.series === undefined || isEditing.value) return
    tableData.value = createTableData(
      props.config.series,
      props.series,
      seriesIds.value,
    )
    isWaitingForTableUpdate.value = props.isLoading
  },
  { debounce: 500, maxWait: 1000 },
)

const showTooltip = (event: MouseEvent, item: any) => {
  if (!item.tooltip) return
  const id = 'tooltip' + Math.random().toString(16).slice(2)
  const element = event.target as HTMLElement
  if (!element) return
  element.id = id
  activator.value = `#${id}`
  tooltip.value = true
  tooltipItem.value = {
    flag: item.flag,
    flagName: store.getFlagName(item.flag),
    flagSource: store.getFlagSourceName(item.flagSource),
    flagColor: item.flagColor,
    user: item.user,
    comment: item.comment,
  }
}

const hideTooltip = (event: MouseEvent) => {
  const element = event.target as HTMLElement
  if (!element) return
  element.id = ''
  activator.value = ''
  tooltip.value = false
}

function stopEdit() {
  isEditing.value = false
  editedSeriesIds.value = []
  newTableData.value = []
}

function save(seriesId: string) {
  const newModifiedData = newTableData.value.filter((item) => {
    const data = item[seriesId] as Partial<TableSeriesData>
    return !(item.isNewRow && (data.y === null || data.y === undefined))
  })
  const newTimeSeriesData = tableDataToTimeSeries(newModifiedData, [seriesId])
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

function canEditItem(item: TableData, seriesId: string) {
  if (!editedSeriesIds.value.includes(seriesId)) return false
  if (nonEquidistantSeries.value.includes(seriesId)) return true

  return props.series[seriesId].data?.some((series) => series.x === item.date)
}

function indexIsInRange(array: unknown[], index: number) {
  return index >= 0 && index < array.length
}

function addRowToTimeSeries(
  row: TableData | undefined,
  position: 'before' | 'after',
) {
  if (row === undefined && tableData.value.length === 0) {
    const newRow = getNewRow(new Date())
    tableData.value.push(newRow)
    newTableData.value.push(newRow)
    selected.value = newRow
    return
  }

  if (row === undefined) return

  const dateSortItem = sortBy.value.find((item) => item.key === 'date')
  const addBefore = dateSortItem
    ? (position === 'before' && dateSortItem.order === 'asc') ||
      (position === 'after' && dateSortItem.order === 'desc')
    : position === 'before'

  const index = tableData.value.findIndex((item) => item.date === row.date)
  const siblingIndex = addBefore ? index - 1 : index + 1

  const newDate = indexIsInRange(tableData.value, siblingIndex)
    ? getMidpointOfDates(row.date, tableData.value[siblingIndex].date)
    : getDateWithMinutesOffset(row.date, addBefore ? -1 : 1)

  const newRow = getNewRow(newDate)

  tableData.value.splice(index + (addBefore ? 0 : 1), 0, newRow)
  newTableData.value.push(newRow)
}

function getNewRow(date: Date) {
  const newRow: TableData = {
    date,
    isNewRow: {},
  }
  editedSeriesIds.value.forEach((id) => {
    if (nonEquidistantSeries.value.includes(id)) {
      newRow[id] = {
        x: date,
        y: null,
        flagOrigin: 'CORRECTED',
        flagQuality: 'RELIABLE',
        flag: '9',
      }
    }
  })

  return newRow
}

const rowAdditionDisabled = computed(() => {
  return selected.value === undefined && tableData.value.length > 0
})

function handleRowClick(e: any, item: any) {
  const formElements = ['INPUT', 'SELECT', 'OPTION']
  if (formElements.includes(e.target.tagName) || !isEditing.value) return

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

  if (!isEditing.value) {
    // Filter out new rows that were not saved
    tableData.value = tableData.value.filter((item) => !item.isNewRow)
    if (selected.value?.isNewRow) clearSelected()
  }
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

th {
  padding-top: 20px !important;
}

th.table-date {
  min-width: 24ch;
  width: 24ch;
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  align-items: center;
}

th.sticky-column {
  position: sticky;
  left: 0;
}

td.table-date {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  align-items: center;
}

td.sticky-column {
  position: sticky;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-select .v-select__selection-text) {
  overflow: unset;
  text-overflow: unset;
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
  height: 10px;
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
