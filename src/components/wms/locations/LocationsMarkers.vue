<template>
  <mgl-marker
    v-for="coordinates in selectedLocationsCoordinates"
    :coordinates="coordinates"
    :offset="[0, 4]"
    anchor="bottom"
  >
    <template #marker>
      <v-icon class="text-shadow" size="32px">mdi-map-marker</v-icon>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { MglMarker } from '@indoorequal/vue-maplibre-gl'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { computed } from 'vue'
import { LngLat } from 'maplibre-gl'
import type { ExtendedLocation } from '@/lib/map'

interface Props {
  geojson: FeatureCollection<Geometry, ExtendedLocation>
}

const props = defineProps<Props>()

const selectedLocationsCoordinates = computed(() => {
  const selectedLocations = props.geojson.features.filter(
    (feature) => feature.properties.selected,
  )

  return selectedLocations
    .flatMap(getLngLatForFeature)
    .filter((lngLat) => lngLat !== undefined)
})

function getLngLatForFeature(feature: Feature<Geometry, ExtendedLocation>) {
  const geometry = feature.geometry
  if (geometry.type === 'Point') {
    const lng = geometry.coordinates[0]
    const lat = geometry.coordinates[1]

    return new LngLat(lng, lat)
  }

  const properties = feature.properties
  if (properties.lon && properties.lat) {
    const lng = +properties.lon
    const lat = +properties.lat

    return new LngLat(lng, lat)
  }
}
</script>

<style scoped>
.text-shadow {
  text-shadow: 0 0 5px var(--theme-color);
}
</style>
