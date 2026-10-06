<template>
  <div ref="tableContainer" class="table-container">
    <v-tooltip v-model="tooltip" :activator="activator" :key="activator">
      <TableTooltip v-bind="tooltipItem">/</TableTooltip>
    </v-tooltip>
    <v-data-table-virtual
      ref="virtualTable"
      class="data-table"
      :headers="tableHeaders"
      :items="tableData"
      :expanded="editedSeriesIds"
      :loading="isWaitingForTableUpdate || isLoadingMore"
      v-model:sortBy="sortBy"
      item-value="date"
      :item-height="virtualItemHeight"
      density="compact"
      no-filter
      fixed-header
      height="100%"
    >
      <template v-slot:headers="{ columns, toggleSort, isSorted, getSortIcon }">
        <tr>
          <template v-for="(column, index) in columns" :key="index">
            <th
              v-if="column.key === 'date'"
              class="table-header table-date sticky-column"
              scope="col"
              :class="{
                'v-data-table__th--sorted': isSorted(column),
                'v-data-table__th--sortable': column.sortable && !isEditing,
              }"
            >
              <div class="table-header-indicator-text">
                <button
                  v-if="column.sortable && !isEditing"
                  type="button"
                  class="table-sort-button"
                  @click="toggleSort(column)"
                >
                  {{ column.title }}
                  <v-icon
                    class="v-data-table-header__sort-icon"
                    :icon="getSortIcon(column)"
                    aria-hidden="true"
                  />
                </button>
                <span v-else>{{ column.title }}</span>
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
              scope="col"
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
          :class="{
            highlighted:
              isEditing && selectedRowDates.size > 0
                ? selectedRowDates.has(item.date.getTime())
                : selected?.date === item.date,
            'row-selected': selectedRowDates.has(item.date.getTime()),
            'row-selectable': isEditing,
          }"
          :data-row-date="item.date.toISOString()"
          :aria-selected="isRowSelected(item)"
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
              {{ d(item.date, 'timeSeriesTable__date') }}
            </div>
          </td>
          <td v-for="id in seriesIds" :key="id">
            <!-- Table cell when editing data -->
            <TableCellEdit
              v-if="isEditing && canEditItem(item, id)"
              :id="id"
              :item="getEditableItem(item)"
              :focused-field="
                selectedRowDates.has(item.date.getTime()) &&
                focusedEditField?.seriesId === id
                  ? focusedEditField.field
                  : undefined
              "
              @update:item="(event, field) => onUpdateItem(event, field)"
              @focus-field="
                focusedEditField = $event
                  ? { seriesId: id, field: $event }
                  : undefined
              "
              @keydown="handleEditFieldKeydown($event, item)"
            />
            <!-- Table cell when not editing data. Shows additional info about flags. -->
            <TableCell
              v-show="!(isEditing && canEditItem(item, id))"
              :id="id"
              :item="item"
              @mouseenter="(event: MouseEvent) => showTooltip(event, item[id])"
              @mouseleave="(event: MouseEvent) => hideTooltip(event)"
            />
          </td>
        </tr>
      </template>
    </v-data-table-virtual>
    <div class="table-status-bar" data-testid="table-status">
      <div class="table-status-bar__summary">
        <span v-if="!isEditing" data-testid="table-status-row-count">
          {{ tableData.length }} {{ tableData.length === 1 ? 'row' : 'rows' }}
          loaded
        </span>
        <span
          v-if="loadedDateRange"
          class="table-status-bar__date-range"
          data-testid="table-status-date-range"
          aria-label="Loaded date range"
        >
          <v-chip
            class="table-status-bar__date-chip"
            height="24"
            variant="tonal"
          >
            <button
              type="button"
              class="table-status-bar__date-chip-action"
              data-testid="jump-to-first-loaded-row"
              aria-label="Jump to first loaded row"
              @click="scrollToLoadedBoundary('first')"
            >
              <v-icon icon="mdi-page-first" size="15px" aria-hidden="true" />
              <time :datetime="loadedDateRange.start.toISOString()">
                {{ d(loadedDateRange.start, 'timeSeriesTable__date') }}
              </time>
            </button>
            <span
              class="table-status-bar__date-divider"
              aria-hidden="true"
            ></span>
            <button
              type="button"
              class="table-status-bar__date-chip-action"
              data-testid="jump-to-last-loaded-row"
              aria-label="Jump to last loaded row"
              @click="scrollToLoadedBoundary('last')"
            >
              <time :datetime="loadedDateRange.end.toISOString()">
                {{ d(loadedDateRange.end, 'timeSeriesTable__date') }}
              </time>
              <v-icon icon="mdi-page-last" size="15px" aria-hidden="true" />
            </button>
          </v-chip>
        </span>
        <span
          v-if="props.selectedDate"
          class="table-status-bar__selection text-primary"
          data-testid="table-status-selected-date"
        >
          <button
            type="button"
            class="table-status-bar__selected-date"
            data-testid="selected-date-jump"
            aria-label="Back to selected date"
            @click="selectDateRow(true)"
          >
            <span>Selected:</span>
            <time :datetime="props.selectedDate.toISOString()">
              {{ d(props.selectedDate, 'timeSeriesTable__date') }}
            </time>
          </button>
          <v-tooltip text="Back to selected date" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-if="!isSelectedDateVisible"
                v-bind="tooltipProps"
                class="table-status-bar__return"
                data-testid="return-to-selected-date"
                :icon="
                  selectedDateDirection === 'up'
                    ? 'mdi-arrow-up-right'
                    : 'mdi-arrow-down-right'
                "
                aria-label="Back to selected date"
                color="primary"
                size="x-small"
                variant="text"
                @click="selectDateRow(true)"
              />
            </template>
          </v-tooltip>
        </span>
      </div>
      <output
        class="table-status-bar__activity"
        data-testid="table-status-activity"
        aria-live="polite"
        aria-atomic="true"
      >
        <template v-if="isEditing">
          <span class="table-status-bar__keyboard-hint">
            <span>
              <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>: move fields
            </span>
            <span> <kbd>Enter</kbd> / <kbd>Space</kbd>: select row </span>
          </span>
        </template>
        <template v-else-if="props.isLoadingMore">Loading more data</template>
        <template v-else-if="isWaitingForTableUpdate || props.isLoading">
          Updating table
        </template>
      </output>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { useTheme } from 'vuetify'
import { watchDebounced } from '@vueuse/core'
import TableTooltip from './TableTooltip.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { getUniqueSeriesIds } from '@/lib/charts/getUniqueSeriesIds'
import type { TableHeaders } from '@/lib/table/types/TableHeaders'
import { createTableHeaders } from '@/lib/table/createTableHeaders'
import { createSeriesDateIndex } from '@/lib/table/createSeriesDateIndex'
import {
  createTableDataPage,
  createTableData,
  getTableSeriesDataLengths,
  mergeTableData,
  tableDataToTimeSeries,
  type TableData,
  type TableSeriesField,
  TableSeriesData,
} from '@/lib/table/tableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import { useConfigStore } from '@/stores/config'
import TableCellEdit from '@/components/table/TableCellEdit.vue'
import TableCell from '@/components/table/TableCell.vue'
import {
  createFlagColorResolver,
  flagColorResolverKey,
} from './flagColorResolver'
import {
  getDateWithMinutesOffset,
  getMidpointOfDates,
  toISOString,
} from '@/lib/date'
import { type ChartsSettings } from '@/lib/topology/componentSettings'
import { findDateIndex } from '@/lib/utils/dates'
import type { PaginatedTimeSeriesPageUpdate } from '@/services/useTimeSeries'
import { useI18n } from 'vue-i18n'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesTable']
  isLoading: boolean
  isLoadingMore?: boolean
  selectedDate?: Date
  pageUpdate?: PaginatedTimeSeriesPageUpdate
}

const props = withDefaults(defineProps<Props>(), { isLoadingMore: false })

const emit = defineEmits(['change', 'update:isEditing', 'load-more-data'])

const store = useFewsPropertiesStore()
const configStore = useConfigStore()
const { d } = useI18n()
const theme = useTheme()
const flagColorResolver = shallowRef(createFlagColorResolver())

provide(flagColorResolverKey, (color) => flagColorResolver.value(color))
watch(
  () => theme.global.current.value,
  () => {
    flagColorResolver.value = createFlagColorResolver()
  },
  { flush: 'post' },
)

const readOnlyMode = ref<boolean>(configStore.general.readonlyMode ?? false)

const seriesIds = ref<string[]>([])
const tooltip = ref<boolean>(false)
const tooltipItem = ref<any>({})
const activator = ref<string>('')
const selected = ref<TableData>()
const selectedRowDates = ref<Set<number>>(new Set())
const selectionAnchorDate = ref<number>()
const focusedEditField = ref<{
  seriesId: string
  field: TableSeriesField
}>()
const tableData = ref<TableData[]>([])
const loadedDateRange = computed(() => {
  const firstRow = tableData.value[0]
  const lastRow = tableData.value.at(-1)
  if (!firstRow || !lastRow) return undefined

  return { start: firstRow.date, end: lastRow.date }
})
const newTableData = ref<TableData[]>([])
const tableHeaders = ref<TableHeaders[]>([])
const tableContainer = ref<HTMLElement | null>(null)
const tableScrollElement = ref<HTMLElement | null>(null)
const isSelectedDateVisible = ref(true)
const selectedDateDirection = ref<'up' | 'down'>('down')
const virtualTable = ref<{
  scrollToIndex: (index: number, position?: 'start' | 'center' | 'end') => void
} | null>(null)
const virtualItemHeight = 36
const paginationThreshold = 100
let seriesDataLengths = new Map<string, number>()
let lastProcessedPageRevision = 0
let hasPendingTopLoad = false
let selectedDateVisibilityFrame: number | undefined

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
      seriesDataLengths = getTableSeriesDataLengths(
        props.config.series,
        props.series,
        seriesIds.value,
      )
      lastProcessedPageRevision = props.pageUpdate?.revision ?? 0
      selectDateRow(true)
    }
    isWaitingForTableUpdate.value = props.isLoading
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
let lastPageSeriesUpdate = new Map<string, Date | undefined>()
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
  async () => {
    if (samePageSeriesUpdate()) {
      lastPageSeriesUpdate.clear()
      return
    }
    await updateTableData()
  },
  { debounce: 500, maxWait: 1000 },
)

watch(
  () => props.pageUpdate?.revision,
  async (revision) => {
    const pageUpdate = props.pageUpdate
    if (
      revision === undefined ||
      pageUpdate === undefined ||
      revision <= lastProcessedPageRevision
    ) {
      return
    }

    await nextTick()
    await updateTableData(pageUpdate)
    lastPageSeriesUpdate = getSeriesLastUpdated()
  },
  { flush: 'post' },
)

function getSeriesLastUpdated() {
  return new Map(
    Object.entries(props.series).map(([id, series]) => [
      id,
      series.lastUpdated,
    ]),
  )
}

function samePageSeriesUpdate() {
  if (lastPageSeriesUpdate.size !== Object.keys(props.series).length) {
    return false
  }

  return [...lastPageSeriesUpdate].every(
    ([id, lastUpdated]) => props.series[id]?.lastUpdated === lastUpdated,
  )
}

async function updateTableData(pageUpdate?: PaginatedTimeSeriesPageUpdate) {
  if (props.series === undefined || isEditing.value) return

  const previousRowCount = tableData.value.length
  const isNewPage =
    pageUpdate !== undefined &&
    pageUpdate.revision > lastProcessedPageRevision &&
    tableData.value.length > 0
  const pageData = isNewPage
    ? createTableDataPage(
        props.config.series,
        props.series,
        seriesIds.value,
        seriesDataLengths,
        pageUpdate.direction,
      )
    : undefined
  const updatedTableData = pageData
    ? mergeTableData(tableData.value, pageData.rows)
    : createTableData(props.config.series, props.series, seriesIds.value)

  seriesDataLengths = pageData
    ? pageData.seriesDataLengths
    : getTableSeriesDataLengths(
        props.config.series,
        props.series,
        seriesIds.value,
      )
  if (isNewPage) lastProcessedPageRevision = pageUpdate.revision
  tableData.value = updatedTableData

  if (hasPendingTopLoad) {
    hasPendingTopLoad = false
    const addedRowCount = Math.max(
      updatedTableData.length - previousRowCount,
      0,
    )
    if (addedRowCount > 0) {
      await nextTick()
      if (tableScrollElement.value) {
        tableScrollElement.value.scrollTop += addedRowCount * virtualItemHeight
      }
    }
  }

  if (props.selectedDate !== undefined) {
    await nextTick()
    selectDateRow(previousRowCount === 0)
  }

  isWaitingForTableUpdate.value = props.isLoading
}

onMounted(async () => {
  await nextTick()
  tableScrollElement.value =
    tableContainer.value?.querySelector<HTMLElement>('.v-table__wrapper') ??
    null
  tableScrollElement.value?.addEventListener('scroll', handleTableScroll, {
    passive: true,
  })
  selectDateRow(true)
})

watch(
  () => props.selectedDate,
  async (selectedDate) => {
    if (selectedDate === undefined) return
    await nextTick()
    selectDateRow(true)
  },
)

onUnmounted(() => {
  tableScrollElement.value?.removeEventListener('scroll', handleTableScroll)
  if (selectedDateVisibilityFrame !== undefined) {
    cancelAnimationFrame(selectedDateVisibilityFrame)
  }
})

const showTooltip = (event: MouseEvent, item: any) => {
  if (!item.tooltip) return
  const id = 'tooltip' + Math.random().toString(16).slice(2) // NOSONAR(S2245) non-cryptographic PRNG
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
  selectedRowDates.value = new Set()
  selectionAnchorDate.value = undefined
  focusedEditField.value = undefined
}

function clearSelected() {
  selected.value = undefined
  selectedRowDates.value = new Set()
  selectionAnchorDate.value = undefined
  focusedEditField.value = undefined
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

const seriesDateIndex = computed(() => {
  const seriesById = Object.fromEntries(
    props.config.series.map((chartSeries) => [
      chartSeries.id,
      props.series[chartSeries.dataResources[0]] ?? { data: [] },
    ]),
  )
  return createSeriesDateIndex(seriesById)
})

function canEditItem(item: TableData, seriesId: string) {
  if (!editedSeriesIds.value.includes(seriesId)) return false
  if (nonEquidistantSeries.value.includes(seriesId)) return true

  return seriesDateIndex.value.get(seriesId)?.has(item.date.getTime()) ?? false
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

  const minutesOffset = addBefore ? -1 : 1
  const newDate = indexIsInRange(tableData.value, siblingIndex)
    ? getMidpointOfDates(row.date, tableData.value[siblingIndex].date)
    : getDateWithMinutesOffset(row.date, minutesOffset)

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
  return selectedRowDates.value.size === 0 && tableData.value.length > 0
})

function isRowSelected(item: TableData) {
  return isEditing.value
    ? selectedRowDates.value.has(item.date.getTime())
    : selected.value?.date === item.date
}

function handleRowClick(e: MouseEvent, item: TableData) {
  if (!isEditing.value || !(e.target instanceof Element)) return
  if (!e.target.closest('td.table-date')) return
  if (e.target.closest('input, select, textarea, button')) return

  const dateTime = item.date.getTime()
  if (e.shiftKey && selectionAnchorDate.value !== undefined) {
    selectRowRange(dateTime, e.ctrlKey || e.metaKey)
  } else if (e.ctrlKey || e.metaKey) {
    toggleRowSelection(dateTime)
  } else if (
    selectedRowDates.value.size === 1 &&
    selectedRowDates.value.has(dateTime)
  ) {
    selectedRowDates.value = new Set()
    selectionAnchorDate.value = undefined
  } else {
    selectedRowDates.value = new Set([dateTime])
    selectionAnchorDate.value = dateTime
  }

  updateActiveSelectedRow()
}

function updateActiveSelectedRow() {
  const activeDate = [...selectedRowDates.value].at(-1)
  selected.value = tableData.value.find(
    (row) => row.date.getTime() === activeDate,
  )
}

function selectRowRange(dateTime: number, addToSelection: boolean) {
  const anchorIndex = tableData.value.findIndex(
    (row) => row.date.getTime() === selectionAnchorDate.value,
  )
  const targetIndex = tableData.value.findIndex(
    (row) => row.date.getTime() === dateTime,
  )
  if (anchorIndex < 0 || targetIndex < 0) return

  const nextSelection = addToSelection
    ? new Set(selectedRowDates.value)
    : new Set<number>()
  const startIndex = Math.min(anchorIndex, targetIndex)
  const endIndex = Math.max(anchorIndex, targetIndex)
  for (const row of tableData.value.slice(startIndex, endIndex + 1)) {
    nextSelection.add(row.date.getTime())
  }
  selectedRowDates.value = nextSelection
}

function toggleRowSelection(dateTime: number) {
  const nextSelection = new Set(selectedRowDates.value)
  if (nextSelection.has(dateTime)) {
    nextSelection.delete(dateTime)
  } else {
    nextSelection.add(dateTime)
  }
  selectedRowDates.value = nextSelection
  selectionAnchorDate.value = dateTime
}

async function handleEditFieldKeydown(event: KeyboardEvent, item: TableData) {
  if (!isEditing.value || !['Tab', 'Enter'].includes(event.key)) return

  const isSelectedRow = selectedRowDates.value.has(item.date.getTime())
  if (event.key === 'Tab' && !isSelectedRow) {
    return
  }

  const selector = isSelectedRow
    ? `[data-edit-date="${item.date.toISOString()}"][data-edit-field]`
    : '[data-edit-field]'
  const fields = Array.from(
    tableContainer.value?.querySelectorAll<HTMLElement>(selector) ?? [],
  )
  const fieldIndex = fields.indexOf(event.target as HTMLElement)
  if (fieldIndex < 0) return

  event.preventDefault()
  const offset = event.key === 'Tab' && event.shiftKey ? -1 : 1
  const nextIndex = fieldIndex + offset
  const nextField =
    fields[
      isSelectedRow ? (nextIndex + fields.length) % fields.length : nextIndex
    ]
  await nextTick()
  nextField?.focus({ preventScroll: true })
}

watch(editedSeriesIds, () => {
  if (editedSeriesIds.value.length === 0) {
    clearSelected()
  }
})

function removeSeriesFromNewTableData(seriesId: string) {
  for (let i = newTableData.value.length - 1; i >= 0; i--) {
    if (newTableData.value[i][seriesId] !== undefined) {
      delete newTableData.value[i][seriesId]
      if (Object.keys(newTableData.value[i]).length === 1) {
        newTableData.value.splice(i, 1)
      }
    }
  }
}

function cleanupNewRows() {
  if (tableData.value.some((item) => item.isNewRow)) {
    tableData.value = tableData.value.filter((item) => !item.isNewRow)
  }
  if (selected.value?.isNewRow) clearSelected()
}

function stopEditTimeSeries(seriesId: string) {
  const index = editedSeriesIds.value.indexOf(seriesId)
  if (index > -1) {
    editedSeriesIds.value.splice(index, 1)
    if (editedSeriesIds.value.length === 0) {
      stopEdit()
    } else {
      removeSeriesFromNewTableData(seriesId)
    }
  }

  if (!isEditing.value) {
    cleanupNewRows()
  }
}

function isEditingTimeSeries(seriesId: string) {
  if (seriesId === null) return false
  return editedSeriesIds.value.includes(seriesId)
}

function onUpdateItem(event: TableData, field: TableSeriesField) {
  const seriesId = Object.keys(event).find((key) => key !== 'date')
  if (seriesId === undefined) return

  const editedData = event[seriesId] as Partial<TableSeriesData>
  const sourceDate = event.date.getTime()
  const targetDates = selectedRowDates.value.has(sourceDate)
    ? selectedRowDates.value
    : new Set([sourceDate])
  const rowsByDate = new Map(
    tableData.value.map((row) => [row.date.getTime(), row]),
  )
  const modifiedRowsByDate = new Map(
    newTableData.value.map((row, index) => [row.date.getTime(), index]),
  )

  for (const dateTime of targetDates) {
    const row = rowsByDate.get(dateTime)
    if (!row || !canEditItem(row, seriesId)) continue

    const modifiedIndex = modifiedRowsByDate.get(dateTime)
    const existingData =
      modifiedIndex === undefined
        ? row[seriesId]
        : newTableData.value[modifiedIndex][seriesId]
    const previousData =
      existingData === undefined || existingData instanceof Date
        ? {}
        : (existingData as Partial<TableSeriesData>)
    const updatedSeriesData = {
      ...previousData,
      [field]: editedData[field],
    }

    const modifiedRow: TableData = {
      date: row.date,
      [seriesId]: updatedSeriesData,
    }
    if (modifiedIndex === undefined) {
      modifiedRowsByDate.set(dateTime, newTableData.value.length)
      newTableData.value.push(modifiedRow)
    } else {
      newTableData.value[modifiedIndex] = {
        ...newTableData.value[modifiedIndex],
        [seriesId]: updatedSeriesData,
      }
    }
  }
}

function getEditableItem(item: TableData): TableData {
  const modifiedRow = newTableData.value.find(
    (row) => row.date.getTime() === item.date.getTime(),
  )
  return modifiedRow === undefined ? item : { ...item, ...modifiedRow }
}

function selectDateRow(scrollIntoView = false) {
  const selectedRow = getSelectedDateRow()
  if (selectedRow === undefined) return

  selected.value = selectedRow.item
  if (scrollIntoView) {
    isSelectedDateVisible.value = true
    nextTick(() => {
      virtualTable.value?.scrollToIndex(selectedRow.displayIndex, 'center')
      updateSelectedDateVisibility()
    })
  }
}

function scrollToLoadedBoundary(boundary: 'first' | 'last') {
  if (tableData.value.length === 0) return

  const dateSortOrder = sortBy.value.find((item) => item.key === 'date')?.order
  const isDescending = dateSortOrder === 'desc'
  const firstIndex = isDescending ? tableData.value.length - 1 : 0
  const index =
    boundary === 'first' ? firstIndex : tableData.value.length - 1 - firstIndex

  virtualTable.value?.scrollToIndex(index, 'start')
  updateSelectedDateVisibility()
}

function getSelectedDateRow() {
  const selectedDate = props.selectedDate
  if (selectedDate === undefined || tableData.value.length === 0) return

  const dates = tableData.value.map((item) => item.date)
  const dateIndex = findDateIndex(dates, selectedDate)
  const item = tableData.value[dateIndex]
  if (item === undefined) return

  const dateSortOrder = sortBy.value.find(
    (entry) => entry.key === 'date',
  )?.order
  const displayIndex =
    dateSortOrder === 'desc'
      ? tableData.value.length - dateIndex - 1
      : dateIndex

  return { item, displayIndex }
}

function updateSelectedDateVisibility() {
  if (!props.selectedDate || !tableScrollElement.value) {
    isSelectedDateVisible.value = true
    return
  }

  if (selectedDateVisibilityFrame !== undefined) {
    cancelAnimationFrame(selectedDateVisibilityFrame)
  }
  selectedDateVisibilityFrame = requestAnimationFrame(() => {
    selectedDateVisibilityFrame = undefined
    const scrollElement = tableScrollElement.value
    if (!scrollElement) return

    const selectedRow = scrollElement.querySelector<HTMLElement>(
      'tbody tr.highlighted',
    )
    const selectedDateRow = getSelectedDateRow()
    if (selectedDateRow === undefined) {
      isSelectedDateVisible.value = true
      return
    }

    const scrollBounds = scrollElement.getBoundingClientRect()
    const headerBottom =
      scrollElement.querySelector('thead')?.getBoundingClientRect().bottom ??
      scrollBounds.top
    if (!selectedRow) {
      const headerHeight = headerBottom - scrollBounds.top
      const firstVisibleIndex = Math.max(
        0,
        Math.floor(
          (scrollElement.scrollTop - headerHeight) / virtualItemHeight,
        ),
      )
      selectedDateDirection.value =
        selectedDateRow.displayIndex < firstVisibleIndex ? 'up' : 'down'
      isSelectedDateVisible.value = false
      return
    }

    const rowBounds = selectedRow.getBoundingClientRect()
    if (rowBounds.bottom <= headerBottom) {
      selectedDateDirection.value = 'up'
      isSelectedDateVisible.value = false
    } else if (rowBounds.top >= scrollBounds.bottom) {
      selectedDateDirection.value = 'down'
      isSelectedDateVisible.value = false
    } else {
      isSelectedDateVisible.value = true
    }
  })
}

function handleTableScroll() {
  updateSelectedDateVisibility()
  const element = tableScrollElement.value
  if (
    !element ||
    isEditing.value ||
    props.isLoading ||
    props.isLoadingMore ||
    isWaitingForTableUpdate.value
  ) {
    return
  }

  const maxScrollTop = element.scrollHeight - element.clientHeight
  if (maxScrollTop <= 0) return

  const nearTop = element.scrollTop < paginationThreshold
  const nearBottom = maxScrollTop - element.scrollTop < paginationThreshold
  if (!nearTop && !nearBottom) return

  const isAtTop =
    nearTop && (!nearBottom || element.scrollTop <= maxScrollTop / 2)
  const dateSortOrder = sortBy.value.find((item) => item.key === 'date')?.order
  const direction: 'before' | 'after' =
    isAtTop === (dateSortOrder === 'asc') ? 'before' : 'after'

  if (isAtTop) hasPendingTopLoad = true
  emit('load-more-data', direction)
}
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: column;
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

:deep(td:has(.table-cell-editable)) {
  padding: 0 !important;
}

.data-table {
  display: flex;
  position: relative;
  flex: 1 1 0;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  height: auto;
  margin: auto;
  overflow-y: hidden;
}

.table-status-bar {
  display: flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  overflow: hidden;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 14px;
}

.table-status-bar__summary {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px 16px;
  min-width: 0;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.table-status-bar__summary > * {
  flex: 0 0 auto;
}

.table-status-bar__summary::-webkit-scrollbar {
  display: none;
}

.table-status-bar__date-range {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.table-status-bar__date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0;
  height: 24px;
  min-height: 24px;
  padding-inline: 8px;
  font: inherit;
}

.table-status-bar__date-chip-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}

.table-status-bar__date-chip-action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.table-status-bar__date-divider {
  align-self: stretch;
  width: 1px;
  margin-inline: 8px;
  background-color: currentColor;
  opacity: 0.4;
}

.table-status-bar__selection {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  min-height: 36px;
  white-space: nowrap;
}

.table-status-bar__selected-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 0 4px;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.table-status-bar__selected-date:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.table-status-bar__return {
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
}

.table-status-bar__activity {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.table-status-bar__keyboard-hint,
.table-status-bar__keyboard-hint > span {
  display: inline-flex;
  align-items: center;
}

.table-status-bar__keyboard-hint {
  gap: 10px;
}

.table-status-bar__keyboard-hint > span {
  line-height: 20px;
}

.table-status-bar__keyboard-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 5px;
  margin-right: 3px;
  border: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  border-radius: 4px;
  font-size: 11px;
  vertical-align: 0.15em;
}

@media (max-width: 600px) {
  .table-status-bar {
    gap: 4px;
    padding-inline: 8px;
  }

  .table-status-bar__summary {
    gap: 4px 8px;
  }
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

:deep(tr.row-selectable) {
  user-select: none;
  -webkit-user-select: none;
}

:deep(tr.row-selectable input, tr.row-selectable select) {
  user-select: text;
  -webkit-user-select: text;
}

:deep(tr.row-selected > td:has(.table-cell-editable)) {
  background: repeating-linear-gradient(
    45deg,
    rgba(var(--v-theme-primary), 0.1) 0px,
    rgba(var(--v-theme-primary), 0.1) 12.73px,
    rgba(var(--v-theme-primary), 0.2) 12.73px,
    rgba(var(--v-theme-primary), 0.2) 25.46px
  );
}

:deep(tr.row-selected > td) {
  background-color: rgba(var(--v-theme-primary), 0.12);
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

.table-sort-button {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
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
