<template>
  <v-btn
    icon
    :active="sidePanelStore.isActive('import')"
    @click="sidePanelStore.toggleActive('import')"
  >
    <v-icon icon="mdi-file-import" />
  </v-btn>
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('import')"
      class="d-flex flex-column h-100 w-100"
    >
      <v-toolbar density="compact">
        <span class="ms-4">Import Status</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive('import')"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>
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
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useSidePanelStore } from '@/stores/sidePanel'
import ImportStatusSummary, {
  type ImportStatusDirectory,
} from './ImportStatusSummary.vue'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const sidePanelStore = useSidePanelStore()
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
