<template>
  <ControlChip
    class="outer-chip justify-center overflow-visible"
    aria-label="Coordinate Selector Control"
  >
    <v-icon start>mdi-map-marker</v-icon>

    <span
      class="coordinate-selector__value text-right text-medium-emphasis mr-1"
    >
      {{ coordinateStringParts[0] }}
    </span>
    <span class="coordinate-selector__value text-right text-medium-emphasis">
      {{ coordinateStringParts[1] }}
    </span>
    <v-btn
      :disabled="coordinate === null"
      @click="onFinish"
      density="compact"
      icon="mdi-close"
      class="ms-2"
    />
  </ControlChip>
</template>

<script setup lang="ts">
import { coordinateToStringParts } from '@/lib/workflows'
import type { LngLat } from 'maplibre-gl'
import { computed } from 'vue'
import ControlChip from '@/components/wms/ControlChip.vue'

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
.coordinate-selector__value {
  min-width: calc(4ch + 2em);
}
</style>
