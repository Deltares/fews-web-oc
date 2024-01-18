<template>
  <v-autocomplete
    v-model="selectedLocation"
    label="Search Locations"
    single-line
    hide-details
    rounded
    :items="props.locations"
    item-title="locationName"
    item-value="locationId"
    return-object
    style="width: 250px"
    density="compact"
  >
    <template v-slot:item="{ props }">
      <v-list-item v-bind="props" width="250px" />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'

interface Props {
  locations: Location[]
  selectedLocationId: string | null
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  selectedLocationId: null,
})

const emit = defineEmits(['changeLocationId'])

const selectedLocation = ref<Location | null>(null)

watch(
  () => props.selectedLocationId,
  () => {
    selectedLocation.value =
      props.locations.find(
        (location) => location.locationId === props.selectedLocationId,
      ) ?? null
  },
)

watch(selectedLocation, onSelectLocation)
function onSelectLocation(newValue: Location | null) {
  if (newValue === null) {
    return
  }
  emit('changeLocationId', newValue.locationId)
}
</script>

<style scoped>
.locations-layer__chip {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  top: 10px;
  left: 10px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
