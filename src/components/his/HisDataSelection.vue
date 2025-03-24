<template>
  <v-autocomplete
    v-model="selectedLocationIds"
    :items="locations"
    item-value="locationId"
    :item-title="getLocationName"
    label="Select location"
    clearable
    density="compact"
    variant="outlined"
    multiple
    hide-details
    prepend-icon="mdi-map-marker-multiple"
    class="pa-4"
  >
    <template #selection="{ item, index }">
      <span v-if="index < 3">{{ item.title }}</span>
      <span v-else-if="index === 3">
        ... ({{ selectedLocationIds.length }} selected)
      </span>
    </template>
    <template #append-inner>
      <v-chip>{{ locations.length }}</v-chip>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import type { Location } from '@deltares/fews-pi-requests'

interface Props {
  locations: Location[]
}

defineProps<Props>()

const selectedLocationIds = defineModel<string[]>('selectedLocationIds', {
  required: true,
})

function getLocationName(location: Location) {
  return location.locationName ?? location.locationId
}
</script>
