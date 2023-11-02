<template>
  <v-chip class="chip" :style="{ backgroundColor: backgroundColor }" pill label>
    <v-icon>mdi-map-marker</v-icon>
    <v-switch
      class="ml-2 mt-5"
      v-model="showLocations"
      @change="onShowLocationsChange"
    />
    <v-autocomplete
      v-model="selectedLocation"
      label="Search Locations"
      single-line
      :items="locations"
      item-title="locationName"
      item-value="locationId"
      prepend-inner-icon="mdi-magnify"
      class="ml-2 mt-3"
      density="compact"
      variant="underlined"
      style="width: 300px"
      return-object
    >
      <template v-slot="{ item }">
        <v-list-item>{{ item.locationName }}</v-list-item>
      </template>
    </v-autocomplete>
  </v-chip>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Location } from '@deltares/fews-pi-requests'
import { FeatureCollection, Geometry } from 'geojson'
import { convertGeoJsonToFewsPiLocation } from '@/lib/topology'

interface Props {
  selectedLocationId?: string
  locationsGeoJson?: FeatureCollection<Geometry, Location>
}
const props = defineProps<Props>()

const emit = defineEmits(['update:showLocations', 'update:selectedLocationId'])

const showLocations = ref<boolean>(false)
const locations = ref<Location[]>([])
const selectedLocation = ref<Location | null>(null)

const onGeoJsonChange = () => {
  if (!props.locationsGeoJson) return
  locations.value = convertGeoJsonToFewsPiLocation(props.locationsGeoJson)
  checkSelectedLocation()
}

watch(() => props.locationsGeoJson, onGeoJsonChange)

watch(selectedLocation, () => {
  emit('update:selectedLocationId', selectedLocation.value?.locationId)
})

watch(
  () => props.selectedLocationId,
  () => {
    if (!props.selectedLocationId) return
    checkSelectedLocation()
  },
)

function checkSelectedLocation() {
  selectedLocation.value =
    locations.value.find(
      (location) => location.locationId === props.selectedLocationId,
    ) || null
}

function onShowLocationsChange() {
  emit('update:showLocations', showLocations.value)
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
