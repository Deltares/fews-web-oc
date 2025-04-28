<template>
  <HisAutocomplete
    v-model="selectedParameterIds"
    :items="parameterIds"
    label="Parameters"
    icon="mdi-tag"
    multiple
  />
  <HisAutocomplete
    v-model="selectedModuleInstanceIds"
    :items="moduleInstanceIds"
    label="Module instances"
    icon="mdi-cog"
    multiple
  />
  <HisAutocomplete
    v-model="selectedLocationIds"
    :items="locations"
    label="Locations"
    icon="mdi-map-marker-multiple"
    :getItemValue="getLocationId"
    :getItemTitle="getLocationTitle"
    multiple
  />
</template>

<script setup lang="ts">
import type { Location } from '@deltares/fews-pi-requests'
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'

interface Props {
  parameterIds: string[]
  locations: Location[]
  moduleInstanceIds: string[]
}

defineProps<Props>()

const selectedParameterIds = defineModel<string[]>('selectedParameterIds', {
  required: true,
})
const selectedLocationIds = defineModel<string[]>('selectedLocationIds', {
  required: true,
})
const selectedModuleInstanceIds = defineModel<string[]>(
  'selectedModuleInstanceIds',
  {
    required: true,
  },
)

function getLocationId(location: Location) {
  return location.locationId
}

function getLocationTitle(location: Location) {
  return location.locationName ?? location.locationId
}
</script>
