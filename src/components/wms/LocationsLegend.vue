<template>
  <v-list-item
    v-for="item in itemGroups"
    :key="item.groupName ?? defaultIconValue"
    :prepend-gap="0"
    :class="{
      'text-disabled': !isGroupSelected(item),
    }"
    @click="toggleAll(item)"
  >
    <template #prepend>
      <v-icon
        v-if="item.iconName"
        :icon="toResourceIcon(item.iconName)"
        :aria-label="item.groupName"
        size="16"
        class="mr-2 location-icon"
        :class="{
          'location-icon-selected': isGroupSelected(item),
        }"
      />
      <LocationGeometryIcon
        v-else
        class="mr-2 location-icon"
        :class="{
          'location-icon-selected': isGroupSelected(item),
        }"
        :hasPointFeatures="item.hasPointFeatures"
        :hasNonPointFeatures="item.hasNonPointFeatures"
        :isDark="isDark"
      />
    </template>
    <v-list-item-title>
      {{ item.groupName ?? t('search.otherLocations') }}
    </v-list-item-title>
    <template #append>
      <template v-for="category in item.categories" :key="category.value">
        <v-btn
          v-show="item.categories.length > 1"
          size="xsmall"
          @click.stop="toggleItem(category.value)"
          class="location-icon h-100"
          :class="{
            'location-icon-selected': isSelected(category.value),
          }"
        >
          <LocationGeometryIcon
            v-if="!category.isPointCategory"
            :hasPointFeatures="false"
            :hasNonPointFeatures="true"
            :isDark="isDark"
          />
          <v-icon
            v-else-if="category.thresholdIconName"
            :icon="toResourceIcon(category.thresholdIconName)"
            :aria-label="`${item.groupName ?? t('search.otherLocations')} - treshold`"
            size="16"
          />
          <svg
            v-else
            class="empty-threshold-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="no-threshold-pattern"
                x="0"
                y="0"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 8L8 0M-2 2L2 -2M6 10L10 6"
                  stroke="#64748b"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="square"
                />
              </pattern>
            </defs>
            <circle
              cx="8"
              cy="8"
              r="7"
              fill="url(#no-threshold-pattern)"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </v-btn>
      </template>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toResourceIcon } from '@/lib/icons'
import { useI18n } from 'vue-i18n'
import LocationGeometryIcon from '@/components/wms/locations/LocationGeometryIcon.vue'
import { getLocationGroupName } from '@/lib/map/locations'

type LegendItem = {
  category: string
  iconLabel?: string
  iconName?: string
  thresholdIconName?: string
  value: string
  isPointCategory: boolean
  hasPointFeatures: boolean
  hasNonPointFeatures: boolean
}

type LegendItemGroup = {
  groupName?: string
  iconName?: string
  categories: LegendItem[]
  hasPointFeatures: boolean
  hasNonPointFeatures: boolean
}

const { t } = useI18n()

defineProps<{ isDark: boolean }>()

const items = defineModel<LegendItem[]>('items', { required: true })
const modelValue = defineModel<string[]>({
  default: () => [],
})
const defaultIconValue = '__default-location-icon__'

const itemGroups = computed(() => {
  const groupedByName = new Map<string | undefined, LegendItemGroup>()

  items.value.forEach((item) => {
    const groupName = getLocationGroupName(item)
    const group = groupedByName.get(groupName)
    if (group) {
      group.categories.push(item)
      return
    }

    groupedByName.set(groupName, {
      groupName,
      categories: [item],
      hasPointFeatures: item.hasPointFeatures,
      hasNonPointFeatures: item.hasNonPointFeatures,
    })
  })

  groupedByName.forEach((group) => {
    group.iconName = group.categories.find(
      (category) => category.isPointCategory && category.iconName,
    )?.iconName
    group.hasPointFeatures = group.categories.some(
      (category) => category.hasPointFeatures,
    )
    group.hasNonPointFeatures = group.categories.some(
      (category) => category.hasNonPointFeatures,
    )
  })

  return Array.from(groupedByName.values())
})

function toggleItem(iconValue: string): void {
  modelValue.value = isSelected(iconValue)
    ? modelValue.value.filter((value) => value !== iconValue)
    : [...modelValue.value, iconValue]
}

function isSelected(iconValue: string): boolean {
  return modelValue.value.includes(iconValue)
}

function isGroupSelected(group: LegendItemGroup): boolean {
  return group.categories.some((category) => isSelected(category.value))
}

function toggleAll(group: LegendItemGroup): void {
  const itemValues = group.categories.map((item) => item.value)

  modelValue.value = isGroupSelected(group)
    ? modelValue.value.filter((value) => !itemValues.includes(value))
    : Array.from(new Set([...modelValue.value, ...itemValues]))
}
</script>

<style scoped>
.location-icon {
  padding-left: 2px;
  padding-right: 2px;
  height: 32px;
  opacity: 0.3;
}

.location-icon-selected {
  opacity: 1;
}

.empty-threshold-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  opacity: 0.5;
}
</style>
