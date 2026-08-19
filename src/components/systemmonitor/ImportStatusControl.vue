<template>
  <v-virtual-scroll
    v-if="statusItems.length"
    class="overflow-y-auto h-100"
    :items="statusItems"
    :item-height="62"
  >
    <template #default="{ item }">
      <div class="my-1 mx-2">
        <ImportStatusSummary
          :item="item"
          v-model:expanded="expandedItems[item.dataFeed]"
        />
      </div>
    </template>
  </v-virtual-scroll>
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
import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { ImportExportStatusItem } from './statusTypes'
import ImportStatusSummary from './ImportStatusSummary.vue'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const statusItems = ref<ImportExportStatusItem[]>([])
const expandedItems = ref<Record<string, boolean>>({})
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
    setTimeout(loadStatuses, 10000)
  }
}
</script>
