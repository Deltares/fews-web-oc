<template>
  <slot name="button">
    <v-btn
      :icon="icon"
      :active="sidePanelStore.isActive(type)"
      @click="sidePanelStore.toggleActive(type)"
    >
      <v-badge v-if="badge" location="top right" :content="badge">
        <v-icon>
          {{ icon }}
        </v-icon>
      </v-badge>
      <v-icon v-else>
        {{ icon }}
      </v-icon>
    </v-btn>
  </slot>

  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive(type)"
      class="d-flex flex-column h-100 side-panel"
      aria-label="Side panel"
    >
      <v-toolbar density="compact">
        <span class="ms-4">{{ title }}</span>
        <template #append>
          <v-btn
            v-if="badge"
            size="small"
            variant="flat"
            rounded=""
            @click="$emit('clear')"
            >Clear all</v-btn
          >
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
  badge?: number
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
