<template>
  <v-btn
    icon
    :active="sidePanelStore.isActive('visualize')"
    @click="sidePanelStore.toggleActive('visualize')"
  >
    <v-icon icon="mdi-chart-box-multiple" />
  </v-btn>
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('visualize')"
      class="d-flex flex-column h-100 non-current-data--panel"
    >
      <v-toolbar density="compact">
        <v-toolbar-items>
          <v-btn
            v-for="tab in tabs"
            :key="tab.value"
            :icon="tab.icon"
            @click="toggleTab(tab.value)"
            :active="isActive(tab.value)"
            v-tooltip="tab.text"
            :disabled="tab.disabled"
          >
          </v-btn>
        </v-toolbar-items>
        <span class="ms-4">Non-Current Data</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive('visualize')"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>
      <v-tabs-window v-model="activeTab" class="h-100">
        <v-tabs-window-item value="table" class="h-100">
          <NonCurrentDataPanel
            v-show="activeTab === 'table'"
            :topologyNode="topologyNode"
            isVisualizeMenu
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="map" class="h-100">
          <NonCurrentLayersPanel
            v-show="activeTab === 'map'"
            :topologyNode="topologyNode"
            :layerName="layerName"
          >
          </NonCurrentLayersPanel>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import NonCurrentDataPanel from '@/components/compare/NonCurrentDataPanel.vue'
import NonCurrentLayersPanel from '@/components/compare/NonCurrentLayersPanel.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useSidePanelStore } from '@/stores/sidePanel'
import { nodeHasMap } from '@/lib/topology/nodes'

interface Props {
  topologyNode: TopologyNode
  layerName?: string
}

const { topologyNode, layerName = '' } = defineProps<Props>()

const sidePanelStore = useSidePanelStore()
const tabs = computed(() => {
  return [
    {
      value: 'table',
      icon: 'mdi-table-clock',
      text: 'Data Selection',
      disabled: false,
    },
    {
      value: 'map',
      icon: 'mdi-map-clock',
      text: 'Analysis',
      disabled: !nodeHasMap(topologyNode),
    }
  ] as const
})
const activeTab = ref<'table' | 'map' | undefined>('table')

function isActive(tabName: 'table' | 'map') {
  return activeTab.value === tabName
}

function toggleTab(tabName: 'table' | 'map') {
  activeTab.value = activeTab.value === tabName ? undefined : tabName
}
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

.non-current-data--panel {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
}

:deep(.v-window__container) {
  height: 100%;
}
</style>
