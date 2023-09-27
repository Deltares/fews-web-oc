<template>
  <div class="table-container">
    <v-data-table
      class="data-table"
      :headers="tableHeaders as any"
      :items="tableData"
      :items-per-page="-1"
      density="compact"
      no-filter
      sticky
      :footer-props="{ disablePagination: true, disableItemsPerPage: true }"
    >
      <template v-slot:headers="{ columns }">
        <tr>
          <template v-for="column in columns" :key="column.key">
            <th>
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
      <template #bottom></template>
      <!-- hide footer -->
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { getUniqueSeriesIds } from '@/lib/charts/getUniqueSeriesIds'
import type { TableHeaders } from '@/lib/table/types/TableHeaders'
import { createTableHeaders } from '@/lib/table/createTableHeaders'
import { createTableData } from '@/lib/table/createTableData'
import { watchEffect } from 'vue'

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

const seriesIds = ref<string[]>([])
const tableData = ref<Record<string, unknown>[]>([])
const tableHeaders = ref<TableHeaders[]>([])

watchEffect(() => {
  if (props.config === undefined) return
  seriesIds.value = getUniqueSeriesIds(props.config.series)
  tableHeaders.value = createTableHeaders(
    props.config.series,
    seriesIds.value,
  )
  if (props.series === undefined) return
  tableData.value = createTableData(
    props.config.series,
    props.series,
    seriesIds.value,
  )
})
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

.v-data-table__wrapper {
  width: 100%;
}

.table-header-indicator {
  display: flex;
  height: 100%;
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
