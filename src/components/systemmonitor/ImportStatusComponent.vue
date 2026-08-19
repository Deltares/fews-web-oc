<template>
  <v-data-table
    :headers="headers"
    :items-per-page="100"
    :items="statusItems"
    fixed-header
  >
    <template v-slot:[`item.lastSuccessfulTime`]="{ item }">
      <v-chip
        size="small"
        :color="item.lastSuccessfulTimeBackgroundColor"
        variant="flat"
      >
        {{ item.lastSuccessfulTime }}
      </v-chip>
    </template>
    <template v-slot:[`item.filesFailedCount`]="{ item }">
      <v-chip
        size="small"
        :color="getColor(item.filesFailedCount)"
        variant="flat"
      >
        {{ item.filesFailedCount }}
      </v-chip>
    </template>
    <template #bottom>
      <v-data-table-footer :items-per-page-options="[100, 200, 300]" />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import {
  PiWebserviceProvider,
  type ExportStatus,
  type ImportStatus,
} from '@deltares/fews-pi-requests'
import { onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { ReadonlyDataTableHeader } from '@/lib/table/types/TableHeaders'
import type { ImportExportStatusItem } from './statusTypes'

interface Props {
  timeOut: number
}
const props = defineProps<Props>()

const headers: ReadonlyDataTableHeader[] = [
  { title: 'Type', key: 'statusType' },
  { title: 'Source', key: 'dataFeed' },
  { title: 'Directory', key: 'directory' },
  { title: 'Last successful time', key: 'lastSuccessfulTime' },
  { title: 'Last file', key: 'lastSuccessfulFile' },
  { title: 'Files successful', key: 'filesSuccessfulCount' },
  { title: 'Failed files', key: 'filesFailedCount' },
]
const statusItems = ref<ImportExportStatusItem[]>([])
let active: boolean = false

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

onUnmounted(() => {
  active = false
})

onMounted(async () => {
  active = true
  await loadStatuses()
})

function getColor(failure: number): string {
  if (failure == 0) return 'grey'
  return 'red'
}

function normalizeStatuses(
  items: (ImportStatus | ExportStatus)[],
  statusType: 'import' | 'export',
): ImportExportStatusItem[] {
  return items.map((item) => ({
    ...item,
    statusType,
  }))
}

async function loadStatuses() {
  try {
    if (!active) return

    const [importResult, exportResult] = await Promise.allSettled([
      webServiceProvider.getImportStatus(),
      webServiceProvider.getExportStatus(),
    ])

    const importItems =
      importResult.status === 'fulfilled'
        ? normalizeStatuses(importResult.value.importStatus, 'import')
        : []
    const exportItems =
      exportResult.status === 'fulfilled'
        ? normalizeStatuses(exportResult.value.exportStatus, 'export')
        : []

    statusItems.value = [...importItems, ...exportItems]
  } catch (error) {
    console.warn(error)
  } finally {
    setTimeout(loadStatuses, props.timeOut)
  }
}
</script>
