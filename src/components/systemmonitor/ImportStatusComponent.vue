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
import { onMounted, onUnmounted } from 'vue'
import type { ReadonlyDataTableHeader } from '@/lib/table/types/TableHeaders'
import { useImportExportStatus } from './useImportExportStatus'

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
const { statusItems, startPolling, stopPolling } = useImportExportStatus({
  pollIntervalMs: props.timeOut,
})

onUnmounted(() => {
  stopPolling()
})

onMounted(async () => {
  await startPolling()
})

function getColor(failure: number): string {
  if (failure == 0) return 'grey'
  return 'red'
}
</script>
