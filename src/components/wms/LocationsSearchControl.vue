<template>
  <ControlChip v-if="hasLocations" :class="{ 'pr-0': showLocations }">
    <v-btn
      @click="showLocations = !showLocations"
      density="compact"
      icon
      variant="plain"
    >
      <v-icon>
        {{ showLocations ? 'mdi-map-marker' : 'mdi-map-marker-off' }}
      </v-icon>
    </v-btn>

    <v-btn
      variant="text"
      v-if="showLocations"
      class="locations-search text-capitalize"
      hide-details
      @click="showLocationsSearch"
    >
      {{ selectedLocation?.locationName ?? 'Search locations' }}
    </v-btn>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'
import { useGlobalSearchState } from '@/stores/globalSearch'
import ControlChip from '@/components/wms/ControlChip.vue'

interface Props {
  locations?: Location[]
  selectedLocationIds?: string[]
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

const emit = defineEmits(['changeLocationIds'])

const selectedLocation = ref<Location | null>(null)

const hasLocations = computed(() => {
  return props.locations?.length
})

function getLocationFromId(locationId: string | undefined) {
  if (locationId === undefined) return null
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

watchEffect(
  () =>
    // TODO: What should this search control do in case of multiple locations?
    //       For now just selects the first location.
    (selectedLocation.value = getLocationFromId(
      props.selectedLocationIds?.[0],
    )),
)

function onSelectLocationId(id: string | undefined) {
  if (id === undefined) {
    return
  }
  emit('changeLocationIds', [id])
}
</script>
