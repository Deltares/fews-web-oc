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
      :items="locationNames"
      item-title="locationName"
      item-value="locationId"
      @update:model-value="onSelectLocation"
      prepend-inner-icon="mdi-magnify"
      class="ml-2 mt-3"
      density="compact"
      variant="underlined"
      style="width: 300px"
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
  locationId: string
  locationsGeoJson?: FeatureCollection<Geometry, Location>
}
const props = withDefaults(defineProps<Props>(), {
  locationId: '',
  locationsGeoJson: undefined,
})

const emit = defineEmits(['update:showLocations', 'update:locationId'])

const showLocations = ref<boolean>(false)
const locationId = ref<string | null>(null)
const locations = ref<Location[]>([])
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

watch(locationId, (newValue) => {
  selectedLocation.value =
    locations.value.find((location) => location.locationId === newValue) || null
})

const onSelectLocation = (location: Location) => {
  locationId.value = location ? location.locationId : null
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
