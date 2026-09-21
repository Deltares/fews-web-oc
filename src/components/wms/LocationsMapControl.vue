<template>
  <ControlChip v-if="hasLocations" :class="{ 'pr-0': showLocations }">
    <v-btn @click="showLocations = !showLocations" density="compact" icon>
      <v-icon size="large">
        {{ showLocations ? 'mdi-map-marker' : 'mdi-map-marker-off' }}
      </v-icon>
    </v-btn>
    <template v-if="showLocations">
      <v-divider vertical />
      <v-menu transition="slide-y-transition" :close-on-content-click="false">
        <template #activator="{ props: menuProps, isActive }">
          <v-btn
            v-bind="menuProps"
            variant="text"
            class="locations-search pl-0"
            :aria-label="t('search.selectedLocations')"
          >
            <template v-for="category in categories" :key="category.value">
              <v-tooltip
                :text="category.iconLabel ?? category.iconName"
                location="bottom"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="location-icon"
                    :class="{
                      'location-icon-selected': isIconSelected(category.value),
                    }"
                    size="xsmall"
                    @click.stop="toggleIcon(category.value)"
                  >
                    <img
                      v-if="category.thresholdIconName ?? category.iconName"
                      :src="
                        getResourcesIconsUrl(
                          category.thresholdIconName ?? category.iconName ?? '',
                        )
                      "
                      :alt="category.iconLabel"
                      width="16"
                      height="16"
                    />
                    <svg
                      v-else
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="5"
                        fill="#dfdfdf"
                        stroke="black"
                        stroke-width="1.5"
                      />
                    </svg>
                  </v-btn>
                </template>
              </v-tooltip>
            </template>
            <v-divider vertical />
            <span class="ml-2">
              {{ formatLocationsText(selectedLocations) }}
            </span>
            <template #append>
              <SelectIcon :active="isActive" />
            </template>
          </v-btn>
        </template>
        <v-list class="information-panel-list" density="compact" width="280">
          <LocationsLegend
            v-model="selectedLocationCategories"
            :items="categories"
          ></LocationsLegend>
          <v-divider class="my-2" />
          <v-list-subheader>{{
            t('search.selectedLocations')
          }}</v-list-subheader>
          <v-list-item v-if="selectedLocations.length === 0">
            <v-list-item-title class="text-medium-emphasis">
              {{ t('search.noSelectedLocation') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="location in selectedLocations"
            :key="location.locationId"
            :title="location.locationName"
          >
            <v-list-item-subtitle>
              {{ t('search.locationId') }}: {{ location.locationId }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="location.description">
              {{ location.description }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Location } from '@deltares/fews-pi-requests'
import ControlChip from '@/components/wms/ControlChip.vue'
import SelectIcon from '@/components/general/SelectIcon.vue'
import LocationsLegend from './LocationsLegend.vue'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'

type TreeNode = {
  id: string
  title: string
  iconName?: string
  children?: TreeNode[]
}

type LocationWithIconLabel = Location & {
  iconLabel?: string
}

type IconOption = {
  category: string
  iconLabel?: string
  iconName?: string
  thresholdIconName?: string
  value: string
}

const { t } = useI18n()

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

const selectedItems = ref<string[]>([])
const items = ref<TreeNode[]>([])
const selectedLocationCategories = defineModel<string[]>(
  'selectedLocationCategories',
  {
    default: () => [],
  },
)
const knownLocationCategories = useStorage<string[]>(
  'weboc-known-location-categories-v1.0.0',
  [],
  sessionStorage,
)

watch(selectedItems, (items) => onSelectLocationIds(items), { deep: true })

watch(
  () => props.selectedLocationIds,
  (ids) => {
    if (ids.length === 0 && selectedItems.value.length === 0) return
    selectedItems.value = ids
  },
  { deep: true },
)

const emit = defineEmits(['changeLocationIds'])

const selectedLocations = computed<Location[]>(() =>
  getLocationsFromIds(props.selectedLocationIds),
)

const hasLocations = computed(() => props.locations?.length)

const getLocationCategory = (location: LocationWithIconLabel) => {
  const activeIcon = location.thresholdIconName ?? location.iconName
  return `${location.iconLabel}-${activeIcon}`
}

const categories = computed(() => {
  const items = new Map<string | undefined, IconOption>()

  props.locations.forEach((location) => {
    const locationWithIconLabel = location as LocationWithIconLabel
    const category = getLocationCategory(locationWithIconLabel)
    console.log('category', category, locationWithIconLabel.iconLabel)
    if (!items.has(category)) {
      items.set(category, {
        category,
        iconName: location.iconName,
        iconLabel:
          locationWithIconLabel.iconLabel ?? locationWithIconLabel.iconName,
        thresholdIconName: location.thresholdIconName,
        value: category,
      })
    }
  })
  return Array.from(items.values()).toSorted((first, second) => {
    const firstHasIcon = first.iconName !== undefined
    const secondHasIcon = second.iconName !== undefined
    if (firstHasIcon && !secondHasIcon) return -1
    if (!firstHasIcon && secondHasIcon) return 1
    return (first.iconLabel ?? '').localeCompare(second.iconLabel ?? '')
  })
})

watch(
  categories,
  (options) => {
    const categoryValues = options.map((category) => category.category)
    const newCategoryValues = categoryValues.filter(
      (category) => !knownLocationCategories.value.includes(category),
    )

    selectedLocationCategories.value = Array.from(
      new Set([...selectedLocationCategories.value, ...newCategoryValues]),
    )
    knownLocationCategories.value = Array.from(
      new Set([...knownLocationCategories.value, ...categoryValues]),
    )
  },
  { immediate: true },
)

function getLocationsFromIds(locationIds: string[]) {
  return locationIds
    .map((locationId) =>
      props.locations.find((location) => location.locationId === locationId),
    )
    .filter((location): location is Location => location !== undefined)
}

function isIconSelected(iconValue: string): boolean {
  return selectedLocationCategories.value.includes(iconValue)
}

function toggleIcon(iconValue: string): void {
  selectedLocationCategories.value = isIconSelected(iconValue)
    ? selectedLocationCategories.value.filter((value) => value !== iconValue)
    : [...selectedLocationCategories.value, iconValue]
}

function buildTree(location: Location): TreeNode {
  const childLocations = props.locationToChildrenMap?.get(location.locationId)
  const children = childLocations?.map(buildTree)
  return {
    id: location.locationId,
    title: location.locationName ?? '',
    iconName: location.thresholdIconName ?? location.iconName,
    children,
  }
}

watch(
  () => props.locations,
  () => {
    items.value = props.locations
      .filter((location) => location.parentLocationId === undefined)
      .map(buildTree)
  },
  { immediate: true },
)

function onSelectLocationIds(ids: string[]) {
  emit('changeLocationIds', ids)
}

function formatLocationsText(locations: Location[]) {
  if (!locations.length) return
  if (locations.length > 1) {
    return (
      locations
        .slice(0, 1)
        .map((l) => l.shortName)
        .join(', ') + ` + ${locations.length - 1} more`
    )
  }
  return locations.map((l) => l.shortName).join(', ')
}
</script>

<style scoped>
.location-icon {
  padding-left: 2px;
  padding-right: 2px;
  opacity: 0.3;
}
.location-icon-selected {
  opacity: 1;
}
</style>
