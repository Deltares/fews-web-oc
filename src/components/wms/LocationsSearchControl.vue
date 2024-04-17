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
    :style="autocompleteStyle"
    density="compact"
  >
    <template v-slot:item="{ props }">
      <v-list-item
        v-bind="props"
        :width="width"
        :max-width="maxWidth"
        density="compact"
      />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'

interface Props {
  locations?: Location[]
  selectedLocationId?: string | null
  maxWidth?: string | number
  width?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  selectedLocationId: null,
})

const emit = defineEmits(['changeLocationId'])

const selectedLocation = ref<Location | null>(null)

function convertWidthToCss(inputWidth: number | string | undefined) {
  if (inputWidth === undefined) return undefined

  let width = inputWidth
  if (typeof width === 'string') {
    // Try to parse width as a number, if it fails, assume it's a CSS string.
    const numericWidth = Number(width)
    if (!isNaN(numericWidth)) width = numericWidth
  }

  return typeof width === 'number' ? `${width}px` : width
}
const autocompleteStyle = computed(() => {
  return {
    width: convertWidthToCss(props.width),
    'max-width': convertWidthToCss(props.maxWidth),
  }
})

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
