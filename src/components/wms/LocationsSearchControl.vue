<template>
  <v-autocomplete
    v-model="selectedLocation"
    label="Search Locations"
    single-line
    hide-details
    flat
    rounded
    :items="props.locations"
    item-title="locationName"
    item-value="locationId"
    return-object
    class="locations-control__autocomplete mb-1 pa"
    dense
  >
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'

interface Props {
  locations: Location[]
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
})

const emit = defineEmits(['click'])

const selectedLocation = ref<Location | null>(null)

watch(selectedLocation, onSelectLocation)
function onSelectLocation(newValue: Location | null) {
  if (newValue === null) {
    return
  }
  console.log('newValue :>> ', newValue)
  emit('click', newValue)
}

watchEffect(onLocationChange)

function onLocationChange(){
  console.log('props.locations :>> ', props.locations)
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
