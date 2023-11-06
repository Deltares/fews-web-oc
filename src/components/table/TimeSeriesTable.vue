<template>
  <div class="table-container">
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
        <v-chip v-if="item[id] !== undefined" variant="text">
          <template
            v-if="item[id].flag !== undefined && item[id].flag !== '0'"
            v-slot:prepend
          >
            <v-icon start size="x-small" :color="getFlagColor(item[id].flag)">
              mdi-circle
            </v-icon>
          </template>
          {{ item[id].value }}
          <template v-if="item[id].comment !== undefined" v-slot:append>
            <v-icon end size="x-small"> mdi-comment-outline </v-icon>
          </template>
        </v-chip>
        <v-tooltip
          activator="parent"
          location="start"
          max-width="200px"
          open-delay="250"
          v-if="showFlagInfoTooltip(item[id])"
        >
          <div v-show="item[id].flag !== undefined">
            <v-icon>mdi-flag-variant</v-icon>
            {{ store.getFlagName(item[id].flag) }}
          </div>
          <div v-show="item[id].flagSource !== undefined">
            <v-icon>mdi-access-point</v-icon>
            {{ store.getFlagSourceName(item[id].flagSource) }}
          </div>
          <div v-show="item[id].user !== undefined">
            <v-icon>mdi-account</v-icon> {{ item[id].user }}
          </div>
          <div v-show="item[id].comment !== undefined">
            <v-icon>mdi-comment</v-icon> {{ item[id].comment }}
          </div>
        </v-tooltip>
      </template>
      <template #bottom></template>
      <!-- hide footer -->
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { getUniqueSeriesIds } from '@/lib/charts/getUniqueSeriesIds'
import type { TableHeaders } from '@/lib/table/types/TableHeaders'
import { createTableHeaders } from '@/lib/table/createTableHeaders'
import { createTableData } from '@/lib/table/createTableData'
import { getFlagColor } from '@/lib/fews-properties/fewsProperties'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'

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
const tableData = ref<Record<string, unknown>[]>([])
const tableHeaders = ref<TableHeaders[]>([])

watchEffect(() => {
  if (props.config === undefined) return
  seriesIds.value = getUniqueSeriesIds(props.config.series)
  tableHeaders.value = createTableHeaders(props.config.series, seriesIds.value)
  if (props.series === undefined) return
  tableData.value = createTableData(
    props.config.series,
    props.series,
    seriesIds.value,
  )
})

function showFlagInfoTooltip(item: Record<string, unknown>) {
  return (
    item !== undefined &&
    (item.flag !== undefined || item.comment !== undefined)
  )
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
</style>

<style>
td:has(span.sticky-column) {
  position: sticky;
  left: 0;
  background-color: rgb(var(--v-theme-surface));
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
