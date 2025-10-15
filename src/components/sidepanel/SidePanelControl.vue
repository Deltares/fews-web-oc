<template>
  <slot name="button">
    <v-btn
      :icon="icon"
      :active="sidePanelStore.isActive(type)"
      @click="sidePanelStore.toggleActive(type)"
    />
  </slot>

  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive(type)"
      class="d-flex flex-column h-100 side-panel"
    >
      <v-toolbar density="compact">
        <span class="ms-4">{{ title }}</span>
        <template #append>
          <v-btn
            @click="sidePanelStore.toggleActive(type)"
            size="small"
            variant="text"
            icon="mdi-close"
          />
        </template>
      </v-toolbar>

      <!-- Main slot -->
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { type SidePanel, useSidePanelStore } from '@/stores/sidePanel'

interface Props {
  type: SidePanel
  title: string
  icon?: string
}
defineProps<Props>()

const sidePanelStore = useSidePanelStore()
</script>

<style scoped>
:deep(.v-window__container) {
  height: 100%;
}

.side-panel {
  width: 450px;
}
</style>
