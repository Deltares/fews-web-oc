<template>
  <v-chip class="chip" :style="{ backgroundColor: backgroundColor }" pill label>
    <v-icon class="mr-2">mdi-map-marker</v-icon>
    <v-switch v-model="show" @click.stop @change="onShowChange" />
    <v-autocomplete
      v-model="selectedLocation"
      label="Search Locations"
      single-line
      :items="locationNames"
      item-text="locationName"
      item-value="locationId"
      @update:model-value="onSelectLocation"
      prepend-inner-icon="mdi-magnify"
      class="ml-2 mt-3"
      dense
    >
      <template v-slot="{ item }">
        <v-list-item>{{ item.locationName }}</v-list-item>
      </template>
    </v-autocomplete>
  </v-chip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Location } from '@deltares/fews-pi-requests'
import { FeatureCollection, Geometry } from 'geojson'
import { convertGeoJsonToFewsPiLocation } from '@/lib/topology'

interface Props {
  locationsGeoJson?: FeatureCollection<Geometry, Location>
}

const props = defineProps<Props>()

const showLocations = ref(true)
const locationId = ref<string | null>(null)
const locations = ref<Location[]>([])
const show = ref(true)
const selectedLocation = ref<Location | null>(null)

const onGeoJsonChange = () => {
  if (!props.locationsGeoJson) return
  locations.value = convertGeoJsonToFewsPiLocation(props.locationsGeoJson)
}

const locationNames = computed(() => {
  const names = locations.value.map((location) => location.locationName)
  return names
})

watch(() => props.locationsGeoJson, onGeoJsonChange)

watch(showLocations, (newValue) => {
  show.value = newValue
})

watch(locationId, (newValue) => {
  selectedLocation.value =
    locations.value.find((location) => location.locationId === newValue) || null
})

const onShowChange = () => {
  showLocations.value = show.value
}

const onSelectLocation = (location: Location) => {
  locationId.value = location ? location.locationId : null
}

const backgroundColor = ref<string>(
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'rgba(0,0,0,.5)'
    : 'rgba(255,255,255,.5)',
)
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
}
</style>
