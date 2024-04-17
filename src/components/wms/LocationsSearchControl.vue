<template>
  <v-autocomplete
    class="locations-search"
    v-model="selectedLocation"
    label="Search Locations"
    single-line
    hide-details
    rounded="0"
    :items="props.locations"
    item-title="locationName"
    item-value="locationId"
    return-object
    style="width: 250px"
    density="compact"
  >
    <template v-slot:item="{ props }">
      <v-list-item v-bind="props" width="250px" density="compact" />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'

interface Props {
  locations?: Location[]
  selectedLocationId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  selectedLocationId: null,
})

const emit = defineEmits(['changeLocationId'])

const selectedLocation = ref<Location | null>(null)

watchEffect(() => {
  selectedLocation.value =
    props.locations.find(
      (location) => location.locationId === props.selectedLocationId,
    ) ?? null
})

watch(selectedLocation, onSelectLocation)
function onSelectLocation(newValue: Location | null) {
  if (newValue === null) {
    return
  }
  emit('changeLocationId', newValue.locationId)
}
</script>

<style>
.locations-search > .v-field__overlay {
  display: none;
}
</style>
