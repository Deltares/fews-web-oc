<template>
  <Teleport to="#main-side-panel" defer>
    <div
      class="d-flex flex-column h-100 side-panel"
      :style="mobile ? 'width: 100vw;' : 'width: 450px;'"
      aria-label="Side panel"
    >
      <v-toolbar density="compact">
        <span class="ms-4">
          {{ title }}
        </span>
        <template #append>
          <v-btn
            @click="emit('close')"
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
import { useDisplay } from 'vuetify'

interface Props {
  title: string
}
defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

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
