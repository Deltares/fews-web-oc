<template>
  <div class="table-container" ref="container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

import {
  type ActionsResponse,
  type TableConfig,
  FancyTable,
} from '@/lib/fancy-table'

import { configManager } from '@/services/application-config'
import { UseTimeSeriesOptions, useTimeSeries } from '@/services/useTimeSeries'

import actionResponseRaw from '@/assets/example-table-config.json'

const theme = useTheme()

interface Props {
  nodeId: string
  locationId: string
}
defineProps<Props>()

const actionResponse = actionResponseRaw as ActionsResponse
const requests = actionResponse.results[0].requests
const tableConfig = actionResponse.results[0].config
  ?.tableDisplay as TableConfig

// TODO: Default period, how to set period?
const now = new Date()
const numDaysBackward = 2
const numDaysForward = 2
const start = new Date(now.getTime() - numDaysBackward * 24 * 60 * 60 * 1000)
const end = new Date(now.getTime() + numDaysForward * 24 * 60 * 60 * 1000)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const lastUpdated = ref<Date>()
const options: UseTimeSeriesOptions = {
  startTime: start,
  endTime: end,
}
const { series } = useTimeSeries(baseUrl, requests, lastUpdated, options)

const container = ref<HTMLDivElement | null>(null)

let table: FancyTable | null = null

// Create the table when the component is mounted.
onMounted(initialise)
function initialise(): void {
  if (!container.value) throw new Error('Container has not been mounted.')

  // Scroll horizontally with the wheel.
  container.value.addEventListener('wheel', (event: WheelEvent) => {
    if (!container.value) return
    event.preventDefault()
    container.value.scrollLeft += event.deltaY
  })

  table = createNewTable()

  // Watch for series being updated, then update the data.
  // TODO: debounced?
  watch(
    () => Object.values(series.value).map((entry) => entry.lastUpdated),
    () => table?.setData(series.value),
  )
}

// Recreate the table when we switch themes.
watch(theme.current, () => {
  table = createNewTable()
  // Force an update with data that is probably already available.
  table.setData(series.value)
})

function createNewTable(): FancyTable {
  if (!container.value) throw new Error('Container has not been mounted.')

  const isDark = theme.current.value.dark
  const newTable = new FancyTable(container.value, tableConfig, isDark)
  newTable.node().style.flexShrink = '0'
  return newTable
}
</script>

<style scoped>
.table-container {
  width: 100%;
  height: fit-content;
  display: flex;
  overflow-x: scroll;
}
</style>
