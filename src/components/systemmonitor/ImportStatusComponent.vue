<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="importStatus"
      :footer-props="{
        itemsPerPageOptions: [100, 200, 300],
      }"
      class="elevation-1"
    >
      <template v-slot:[`item.lastImportTime`]="{ item }">
        <v-chip :color="item.columns.lastImportTimeBackgroundColor" light small
          >{{ item.columns.lastImportTime }}
        </v-chip>
      </template>
      <template v-slot:[`item.fileFailed`]="{ item }">
        <v-chip :color="getColor(item.columns.fileFailed)" light small>
          {{ item.columns.fileFailed }}
        </v-chip>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ImportStatus, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '../../services/application-config'
import { VDataTable } from 'vuetify/labs/VDataTable'
import { transformRequestFn } from '@/lib/requests/transformRequest'
type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
  ? UnwrapReadonlyArrayType<I>
  : A
type DT = InstanceType<typeof VDataTable>
type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

const props = defineProps(['timeOut'])

const headers: ReadonlyDataTableHeader[] = [
  { title: 'Source', key: 'dataFeed' },
  { title: 'Directory', key: 'directory' },
  { title: 'Last import time', key: 'lastImportTime' },
  { title: 'Last file imported', key: 'lastFileImported' },
  { title: 'Files imported', key: 'fileRead' },
  { title: 'Failed imports', key: 'fileFailed' },
]
let importStatus = ref<ImportStatus[]>([])
let active: boolean = false

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: transformRequestFn(),
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

<style scoped></style>
