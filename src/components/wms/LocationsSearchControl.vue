<template>
  <v-chip
    v-if="hasLocations"
    class="locations-control__chip"
    :class="{ 'pr-0': showLocations }"
    pill
    label
  >
    <v-btn
      @click="showLocations = !showLocations"
      density="compact"
      variant="plain"
      icon
    >
      <v-icon>{{
        showLocations ? 'mdi-map-marker' : 'mdi-map-marker-off'
      }}</v-icon>
    </v-btn>

    <v-btn
      variant="text"
      v-if="showLocations"
      class="locations-search text-capitalize"
      hide-details
      @click="showLocationsSearch"
      >{{
        selectedLocationId ? selectedLocationId : 'Search locations'
      }}</v-btn
    >
  </v-chip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'
import { useGlobalSearchState } from '@/stores/globalSearch'

interface Props {
  locations?: Location[]
  selectedLocationId?: string | null
  maxWidth?: string | number
  width?: string | number
  tooltipOpenDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  selectedLocationId: null,
  tooltipOpenDelay: 500,
})

const showLocations = defineModel<boolean>('showLocations', { default: true })

const state = useGlobalSearchState()

const emit = defineEmits(['changeLocationId'])

const selectedLocation = ref<Location | null>(null)

const hasLocations = computed(() => {
  return props.locations?.length
})

function getLocationFromId(locationId: string | null) {
  if (locationId === null) return null
  return (
    props.locations.find((location) => location.locationId === locationId) ??
    null
  )
}

function showLocationsSearch() {
  state.items = props.locations.map((l) => {
    return { id: l.locationId, name: l.locationName ?? '' }
  })
  state.active = true
}

watch(
  () => props.selectedLocationId,
  () => (selectedLocation.value = getLocationFromId(props.selectedLocationId)),
)

watch(selectedLocation, onSelectLocation)
function onSelectLocation(newValue: Location | null) {
  if (newValue === null) {
    return
  }
  emit('changeLocationId', newValue.locationId)
}
</script>

<style>
.locations-control__chip {
  font-size: 0.825em;
  z-index: 1000;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
