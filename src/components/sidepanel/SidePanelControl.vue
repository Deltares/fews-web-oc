<template>
  <slot name="button">
    <v-btn
      icon
      :active="sidePanelStore.isActive(type)"
      size="small"
      @click="sidePanelStore.toggleActive(type)"
    >
      <v-icon :icon="icon" size="large"></v-icon>
    </v-btn>
  </slot>

  <Teleport to="#main-side-panel" defer>
    <div
      v-if="sidePanelStore.isActive(type)"
      class="d-flex flex-column h-100 side-panel"
      :style="mobile ? 'width: 100vw;' : 'width: 450px;'"
      aria-label="Side panel"
    >
      <v-toolbar density="compact">
        <span
          class="ms-4"
          :style="`font-size: ${mobile ? 0.75 : 1.25}rem !important`"
        >
          {{ title }}
        </span>
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
import { useDisplay } from 'vuetify'

interface Props {
  type: SidePanel
  title: string
  icon?: string
}
defineProps<Props>()

const sidePanelStore = useSidePanelStore()
const { mobile } = useDisplay()
</script>

<style scoped>
:deep(.v-window__container) {
  height: 100%;
}

.side-panel {
  width: 450px;
}
</style>
