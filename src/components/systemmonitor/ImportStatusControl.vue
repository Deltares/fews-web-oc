<template>
  <v-virtual-scroll
    v-if="importStatusItems.length"
    class="overflow-y-auto h-100"
    :items="importStatusItems"
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
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import ImportStatusSummary, {
  type ImportStatusDirectory,
} from './ImportStatusSummary.vue'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const importStatusItems = ref<ImportStatusDirectory[]>([])
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
  await loadImportStatus()
})

async function loadImportStatus() {
  try {
    if (!active) return
    const res = await webServiceProvider.getImportStatus()
    importStatusItems.value = res.importStatus as ImportStatusDirectory[]
  } catch (error) {
    console.warn(error)
  } finally {
    setTimeout(loadImportStatus, 10000)
  }
}
</script>
