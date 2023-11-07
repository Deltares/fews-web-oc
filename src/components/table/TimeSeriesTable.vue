<template>
  <div class="table-container">
    <v-tooltip v-model="tooltip" :activator="activator" :key="activator">
      <table-tooltip v-bind="tooltipItem">/</table-tooltip>
    </v-tooltip>
    <v-data-table
      class="data-table"
      :headers="tableHeaders as any"
      :items="tableData"
      :items-per-page="-1"
      density="compact"
      no-filter
      fixed-header
      height="100%"
      :footer-props="{ disablePagination: true, disableItemsPerPage: true }"
    >
      <template v-slot:headers="{ columns }">
        <tr>
          <template v-for="column in columns" :key="column.key">
            <th
              :style="{ minWidth: column.minWidth }"
              :class="(column as TableHeaders).class"
            >
              <div class="table-header-indicator">
                <span class="table-header-indicator-text">{{
                  column.title
                }}</span>
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
        <span class="sticky-column">{{ item.date }}</span>
      </template>
      <template v-for="id in seriesIds" v-slot:[`item.${id}`]="{ item }">
        <span
          v-if="item[id]"
          style="z-index: -1; width: 100%; display: inline-block;"
          @mouseenter="(event) => showTooltip(event, item[id])"
          @mouseleave="(event) => hideTooltip(event)"
        >
          <div class="circle" :class="item[id].flagClass"></div>
          <span class="value">{{ item[id].value }}</span>
          <span v-if="item[id].comment" class="mdi mdi-comment-outline"></span>
        </span>
      </template>
      <template #bottom></template>
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
import { createTableData } from '@/lib/table/createTableData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import { onBeforeMount } from 'vue'

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

const store = useFewsPropertiesStore()
store.loadFlags()
store.loadFlagSources()

const seriesIds = ref<string[]>([])
const tooltip = ref<boolean>(false)
const tooltipItem = ref<any>({})
const activator = ref<string>('')
const tableData = ref<Record<string, unknown>[]>([])
const tableHeaders = ref<TableHeaders[]>([])

onBeforeMount(() => {
  if (props.config !== undefined) {
    seriesIds.value = getUniqueSeriesIds(props.config.series)
    tableHeaders.value = createTableHeaders(
      props.config.series,
      seriesIds.value,
    )
  }

  if (props.config !== undefined) {
    tableData.value = createTableData(
      props.config.series,
      props.series,
      seriesIds.value,
    )
  }
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
    flag: store.getFlagName(item.flag),
    flagSource: store.getFlagSourceName(item.flagSource),
    flagClass: item.flagClass,
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
</script>

<style scoped>
.mdi {
  margin: 2px;
  color: #9e9e9e;
}

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

.circle {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin: auto 2px;
}

.FFFF00 {
  background-color: #ffff00;
}
.FF8000 {
  background-color: #ff8000;
}
.FF0000 {
  background-color: #ff0000;
}
.FFC800 {
  background-color: #ffc800;
}
.FFFFFF {
  background-color: #ffffff;
}

.value {
  display: inline-block;
  line-height: 100%;
  min-width: 10px;
}
</style>

<style>
td:has(span.sticky-column) {
  position: sticky;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
