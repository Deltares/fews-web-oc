<template>
  <v-chip pill label class="outer-chip chip justify-center overflow-visible">
    <v-icon class="pr-2">mdi-map-marker</v-icon>

    <span class="coordinate-selector__value text-right mr-1">
      {{ coordinateStringParts[0] }}
    </span>
    <span class="coordinate-selector__value text-right mr-2">
      {{ coordinateStringParts[1] }}
    </span>
    <v-btn
      :disabled="coordinate === null"
      @click="onFinish"
      density="compact"
      color="primary"
      class="px-0"
    >
      Apply
    </v-btn>
  </v-chip>
</template>

<script setup lang="ts">
import { coordinateToStringParts } from '@/lib/workflows'
import type { LngLat } from 'maplibre-gl'
import { computed } from 'vue'

const coordinate = defineModel<LngLat | null>('coordinate', {
  default: null,
})
const isActive = defineModel<boolean>('active', { default: false })

const coordinateStringParts = computed(() =>
  coordinateToStringParts(coordinate.value),
)

function onFinish(): void {
  isActive.value = false
}
</script>

<style scoped>
.chip {
  font-size: 0.825em;
  z-index: 1000;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.coordinate-selector__value {
  min-width: calc(4ch + 2em);
}
</style>
