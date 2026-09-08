<template>
  <Teleport to="#main-side-panel" defer>
    <div
      class="d-flex flex-column h-100"
      :style="mobile ? 'width: 100vw;' : 'width: 450px;'"
      aria-label="Side panel"
    >
      <v-toolbar density="compact">
        <v-btn
          v-if="canGoBack"
          @click="emit('back')"
          icon
          size="small"
          class="ms-1"
          aria-label="Back"
        >
          <v-icon size="small">mdi-arrow-left</v-icon>
        </v-btn>
        <div id="sidepanel-prepend-teleport-target" />
        <span class="w-100" :class="canGoBack ? 'ps-2' : 'ps-4'">
          {{ title }}
        </span>
        <template #append>
          <v-btn @click="emit('close')" icon size="small">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <!-- Main slot -->
      <slot></slot>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'

interface Props {
  title: string
  canGoBack?: boolean
}
defineProps<Props>()

interface Emits {
  close: []
  back: []
}
const emit = defineEmits<Emits>()

const { mobile } = useDisplay()
</script>

<style scoped>
:deep(.v-window__container) {
  height: 100%;
}
</style>
