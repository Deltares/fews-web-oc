<template>
  <ControlChip class="outer-chip justify-center overflow-visible">
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
