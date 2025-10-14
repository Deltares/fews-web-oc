<template>
  <v-btn
    icon
    :active="sidePanelStore.isActive('workflows')"
    @click="sidePanelStore.toggleActive('workflows')"
    :disabled="
      !topologyNode?.secondaryWorkflows?.length && !topologyNode?.workflowId
    "
  >
    <v-icon>mdi-cog-play</v-icon>
  </v-btn>
  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive('workflows')"
      class="h-100 workflows-panel"
    >
      <v-toolbar density="compact">
        <span class="ms-4">Run Workflow</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive('workflows')"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>
      <WhatIfDisplayView :topologyNode="topologyNode" class="flex-1-1" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import WhatIfDisplayView from '@/views/WhatIfDisplayView.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useSidePanelStore } from '@/stores/sidePanel'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const sidePanelStore = useSidePanelStore()
</script>

<style scoped>
:deep(.v-window__container) {
  height: 100%;
}

.workflows-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 450px;
}
</style>
