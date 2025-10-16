<template>
  <ControlChip v-if="hasLocations" :class="{ 'pr-0': showLocations }">
    <v-btn @click="showLocations = !showLocations" density="compact" icon>
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
      {{ formatLocationsText(selectedLocations) }}
    </v-btn>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'
import { useGlobalSearchState } from '@/stores/globalSearch'
import ControlChip from '@/components/wms/ControlChip.vue'

interface Props {
  locations?: Location[]
  locationToChildrenMap?: Map<string, Location[]>
  selectedLocationIds: string[]
  maxWidth?: string | number
  width?: string | number
  tooltipOpenDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  tooltipOpenDelay: 500,
})

const showLocations = defineModel<boolean>('showLocations', { default: true })

const state = useGlobalSearchState()

watch(
  () => state.selectedItems,
  (items) => onSelectLocationIds(items),
  { deep: true },
)

watch(
  () => props.selectedLocationIds,
  (ids) => {
    if (ids.length === 0 && state.selectedItems.length === 0) return
    return (state.selectedItems = ids)
  },
  { immediate: true, deep: true },
)

const emit = defineEmits(['changeLocationIds'])

const selectedLocations = computed<Location[]>(() =>
  getLocationsFromIds(props.selectedLocationIds),
)

const hasLocations = computed(() => props.locations?.length)

function getLocationsFromIds(locationIds: string[]) {
  return props.locations.filter((location) =>
    locationIds.includes(location.locationId),
  )
}

function showLocationsSearch() {
  state.active = true
}

type TreeNode = {
  id: string
  title: string
  children?: TreeNode[]
}

function buildTree(location: Location): TreeNode {
  const childLocations = props.locationToChildrenMap?.get(location.locationId)
  const children = childLocations?.map(buildTree)
  return {
    id: location.locationId,
    title: location.locationName ?? '',
    children,
  }
}

watch(
  () => props.locations,
  () => {
    state.items = props.locations
      .filter((location) => location.parentLocationId === undefined)
      .map(buildTree)
  },
  { immediate: true },
)

function onSelectLocationIds(ids: string[]) {
  emit('changeLocationIds', ids)
}

function formatLocationsText(locations: Location[]) {
  if (!locations.length) return 'Search locations'
  if (locations.length > 1) {
    return (
      locations
        .slice(0, 1)
        .map((l) => l.locationName)
        .join(', ') + ` + ${locations.length - 1} more`
    )
  }
  return locations.map((l) => l.locationName).join(', ')
}
</script>
