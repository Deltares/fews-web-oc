<template>
  <v-tooltip
    :open-delay="tooltipOpenDelay"
    :disabled="isExpanded || !selectedLocationId"
  >
    <template #activator="{ props: autocompleteProps }">
      <v-chip
        v-if="hasLocations"
        class="locations-layer__chip"
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
        <v-autocomplete
          v-if="showLocations"
          v-bind="autocompleteProps"
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
          @update:focused="(isFocused) => (isExpanded = isFocused)"
        >
          <template #item="{ item, props }">
            <v-tooltip :open-delay="tooltipOpenDelay">
              <template #activator="{ props: itemProps }">
                <v-list-item
                  v-bind="{ ...itemProps, ...props }"
                  :width="width"
                  :max-width="maxWidth"
                  density="compact"
                />
              </template>
              <span>{{ getTooltipTextFromId(item.value) }}</span>
            </v-tooltip>
          </template>
        </v-autocomplete>
      </v-chip>
    </template>
    <span>{{ getTooltipText(selectedLocation) }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'

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

const showLocations = defineModel<boolean>('showLocations', { default: true})

const emit = defineEmits(['changeLocationId'])

const isExpanded = ref(false)
const selectedLocation = ref<Location | null>(null)

const hasLocations = computed(() => {
  return props.locations?.length
})

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

function getLocationFromId(locationId: string | null) {
  if (locationId === null) return null
  return (
    props.locations.find((location) => location.locationId === locationId) ??
    null
  )
}

function degreesToString(raw: number): string {
  let remainder = raw

  const degrees = Math.floor(raw)
  remainder -= degrees

  remainder *= 60
  const minutes = Math.floor(remainder)
  remainder -= minutes

  const seconds = (remainder * 60).toFixed(2)

  return `${degrees}°${minutes}'${seconds}''`
}

function getTooltipText(location: Location | null): string {
  if (!location) return ''

  let tooltip = `${location.locationName}`
  if (location.lat && location.lon) {
    const lat = degreesToString(+location.lat)
    const lon = degreesToString(+location.lon)
    tooltip += ` (${lat} N, ${lon} E)`
  }
  return tooltip
}

function getTooltipTextFromId(locationId: string): string {
  const location = getLocationFromId(locationId)
  return getTooltipText(location)
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
.locations-search > .v-field__overlay {
  display: none;
}

/* Hide horizontal scrollbar in autocomplete dropdown menu on FireFox. */
.v-autocomplete__content > .v-list {
  overflow-x: hidden !important;
}

.locations-layer__chip {
  font-size: 0.825em;
  z-index: 1000;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
