<template>
  <HisAutocomplete
    :items="parameters"
    label="Parameters"
    icon="mdi-tag"
    :getItemValue="getParameterId"
    :getItemTitle="getParameterTitle"
    v-model:selectedIds="selectedParameters"
  />
  <HisAutocomplete
    :items="locations"
    label="Locations"
    icon="mdi-map-marker-multiple"
    :getItemValue="getLocationId"
    :getItemTitle="getLocationTitle"
    v-model:selectedIds="selectedLocationIds"
  />
</template>

<script setup lang="ts">
import type { Location } from '@deltares/fews-pi-requests'
import HisAutocomplete from '@/components/his/HisAutocomplete.vue'

interface Props {
  parameters: { parameterId: string; qualifierId: string[] | undefined }[]
  locations: Location[]
}

defineProps<Props>()

const selectedParameters = defineModel<string[]>('selectedParameters', {
  required: true,
})
const selectedLocationIds = defineModel<string[]>('selectedLocationIds', {
  required: true,
})

function getParameterId(parameter: {
  parameterId: string
  qualifierId: string[] | undefined
}) {
  return `${parameter.parameterId}$${parameter.qualifierId?.join(',') ?? ''}`
}

function getLocationId(location: Location) {
  return location.locationId
}

function getParameterTitle(parameter: {
  parameterId: string
  qualifierId: string[] | undefined
}) {
  const qualifiers = parameter.qualifierId
    ? ` (${parameter.qualifierId.join('')})`
    : ''
  return `${parameter.parameterId}${qualifiers}`
}

function getLocationTitle(location: Location) {
  return location.locationName ?? location.locationId
}
</script>
