<template>
  <ControlChip v-if="hasLocations" :class="{ 'pr-0': showLocations }">
    <v-btn @click="showLocations = !showLocations" density="compact" icon>
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
        selectedLocationId ? selectedLocation?.locationName : 'Search locations'
      }}</v-btn
    >
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'
import { useGlobalSearchState } from '@/stores/globalSearch'
import ControlChip from '@/components/wms/ControlChip.vue'

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

watch(
  () => state.selectedItem,
  (item) => onSelectLocationId(item?.id),
)

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
  state.active = true
}

watch(
  () => props.locations,
  () => {
    state.items = props.locations.map((l) => {
      return { id: l.locationId, name: l.locationName ?? '' }
    })
  },
)

watch(
  () => props.selectedLocationId,
  () => (selectedLocation.value = getLocationFromId(props.selectedLocationId)),
)

function onSelectLocationId(id: string | undefined) {
  if (id === undefined) {
    return
  }
  emit('changeLocationId', id)
}
</script>
