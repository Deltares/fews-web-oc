<template>
  <mgl-marker
    v-if="coordinate"
    v-model:coordinates="coordinate"
    draggable
    :offset="[0, 4]"
    anchor="bottom"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <template #marker>
      <v-icon size="32px" color="primary" class="marker-icon">
        mdi-map-marker
      </v-icon>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { coordinateToString } from '@/lib/workflows'
import { useMap } from '@/services/useMap'
import { MglMarker } from '@indoorequal/vue-maplibre-gl'
import { Popup, type LngLat } from 'maplibre-gl'
import { watchEffect } from 'vue'

const coordinate = defineModel<LngLat | null>('coordinate', {
  default: null,
})

const { map } = useMap()

const tooltipPopup = new Popup({
  closeButton: false,
  closeOnClick: false,
  focusAfterOpen: false,
  subpixelPositioning: true,
  offset: [0, -26],
  className: 'coordinate-info-popup',
  maxWidth: 'none',
})

watchEffect(() => {
  if (!coordinate.value) return

  tooltipPopup
    .setText(coordinateToString(coordinate.value))
    .setLngLat(coordinate.value)
})

function onDragStart() {
  if (!map) return
  tooltipPopup.addTo(map)
}

function onDragEnd() {
  if (!map) return
  tooltipPopup.remove()
}
</script>

<style scoped>
.marker-icon {
  text-shadow: 0 0 5px var(--theme-color);
}
</style>
