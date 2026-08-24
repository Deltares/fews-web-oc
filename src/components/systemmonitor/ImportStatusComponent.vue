<template>
  <v-data-table
    :headers="headers"
    :items-per-page="100"
    :items="importStatus"
    fixed-header
  >
    <template v-slot:[`item.lastImportTime`]="{ item }">
      <v-chip
        size="small"
        :color="item.lastImportTimeBackgroundColor"
        variant="flat"
      >
        {{ item.lastImportTime }}
      </v-chip>
    </template>
    <template v-slot:[`item.fileFailed`]="{ item }">
      <v-chip size="small" :color="getColor(item.fileFailed)" variant="flat">
        {{ item.fileFailed }}
      </v-chip>
    </template>
    <template #bottom>
      <v-data-table-footer :items-per-page-options="[100, 200, 300]" />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { ImportStatus, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { ReadonlyDataTableHeader } from '@/lib/table/types/TableHeaders'

interface Props {
  timeOut: number
}
const props = defineProps<Props>()

const headers: ReadonlyDataTableHeader[] = [
  { title: 'Source', key: 'dataFeed' },
  { title: 'Directory', key: 'directory' },
  { title: 'Last import time', key: 'lastImportTime' },
  { title: 'Last file imported', key: 'lastFileImported' },
  { title: 'Files imported', key: 'fileRead' },
  { title: 'Failed imports', key: 'fileFailed' },
]
const importStatus = ref<ImportStatus[]>([])
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
  await loadImportStatus()
})

function getColor(failure: number): string {
  if (failure == 0) return 'grey'
  return 'red'
}

async function loadImportStatus() {
  try {
    if (!active) return
    const res = await webServiceProvider.getImportStatus()
    importStatus.value = res.importStatus
  } catch (error) {
    console.warn(error)
  } finally {
    setTimeout(loadImportStatus, props.timeOut)
  }
}
</script>
