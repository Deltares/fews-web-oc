<template>
  <v-list-item
    v-for="item in itemGroups"
    :key="item.iconLabel ?? defaultIconValue"
    :class="{
      'text-disabled': !isLabelSelected(item.iconLabel),
    }"
    @click="toggleAll(item.iconLabel)"
  >
    <template #prepend>
      <v-img
        v-if="item.thresholdIconName ?? item.iconName"
        :src="
          getResourcesIconsUrl(item.thresholdIconName ?? item.iconName ?? '')
        "
        class="mr-2 location-icon"
        :class="{
          'location-icon-selected': isLabelSelected(item.iconLabel),
        }"
        width="16"
        height="16"
        contain
      />
      <svg
        v-else
        class="mr-2 location-icon"
        :class="{
          'location-icon-selected': isLabelSelected(item.iconLabel),
        }"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="7"
          fill="#dfdfdf"
          stroke="black"
          stroke-width="2"
        />
      </svg>
    </template>
    <v-list-item-title>
      {{ item.iconLabel ?? t('search.otherLocations') }}
    </v-list-item-title>
    <template #append>
      <template v-for="category in item.categories" :key="category.value">
        <v-img
          v-if="category.thresholdIconName"
          :src="getResourcesIconsUrl(category.thresholdIconName ?? '')"
          class="mr-2 location-icon"
          :class="{
            'location-icon-selected': isSelected(category.value),
          }"
          width="16"
          height="16"
          @click.stop="toggleItem(category.value)"
        />
        <svg
          v-else-if="item.categories.length > 1"
          class="mr-2 location-icon empty-threshold-icon"
          :class="{
            'location-icon-selected': isSelected(category.value),
          }"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          aria-hidden="true"
          @click.stop="toggleItem(category.value)"
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
      </template>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { useI18n } from 'vue-i18n'

type LegendItem = {
  category: string
  iconLabel?: string
  iconName?: string
  thresholdIconName?: string
  value: string
}

type LegendItemGroup = {
  iconLabel?: string
  iconName?: string
  thresholdIconName?: string
  categories: LegendItem[]
}

const { t } = useI18n()

const items = defineModel<LegendItem[]>('items', { required: true })
const modelValue = defineModel<string[]>({
  default: () => [],
})
const defaultIconValue = '__default-location-icon__'

const itemGroups = computed(() => {
  const groupedByLabel = new Map<string | undefined, LegendItemGroup>()

  items.value.forEach((item) => {
    const group = groupedByLabel.get(item.iconLabel)
    if (group) {
      group.categories.push(item)
      return
    }

    groupedByLabel.set(item.iconLabel, {
      iconLabel: item.iconLabel,
      iconName: item.iconName,
      thresholdIconName: item.thresholdIconName,
      categories: [item],
    })
  })

  return Array.from(groupedByLabel.values())
})

function toggleItem(iconValue: string): void {
  modelValue.value = isSelected(iconValue)
    ? modelValue.value.filter((value) => value !== iconValue)
    : [...modelValue.value, iconValue]
}

function isSelected(iconValue: string): boolean {
  return modelValue.value.includes(iconValue)
}

function isLabelSelected(iconLabel?: string): boolean {
  const categoryValues = items.value
    .filter((category) => category.iconLabel === iconLabel)
    .map((category) => category.value)

  return categoryValues.length > 0 && categoryValues.every(isSelected)
}

function toggleAll(iconLabel?: string): void {
  console.log('iconLabel', iconLabel)
  const itemValues = items.value
    .filter((item) => item.iconLabel === iconLabel)
    .map((item) => item.value)

  modelValue.value = isLabelSelected(iconLabel)
    ? modelValue.value.filter((value) => !itemValues.includes(value))
    : Array.from(new Set([...modelValue.value, ...itemValues]))
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

.empty-threshold-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  opacity: 0.5;
}
</style>
