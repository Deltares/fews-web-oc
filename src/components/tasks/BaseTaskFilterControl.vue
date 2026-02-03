<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props, isActive }">
      <v-chip
        variant="tonal"
        pilled
        label
        :color="isAllSelected ? undefined : 'primary'"
        v-bind="props"
        class="ms-2 px-2"
      >
        <template #prepend>
          <v-btn
            class="mr-1"
            size="20"
            variant="plain"
            :icon="isAllSelected ? 'mdi-filter-plus' : 'mdi-filter-remove'"
            @click="removeFilterIfEnabled"
          />
        </template>
        {{ label }}
        <v-spacer />
        <SelectIcon :active="isActive" />
      </v-chip>
    </template>
    <v-sheet max-height="400">
      <slot name="actions">
        <v-list-item title="Select All" @click="toggleSelectAll">
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn
                :indeterminate="isSomeSelected && !isAllSelected"
                :model-value="isAllSelected"
                density="compact"
              />
            </v-list-item-action>
          </template>
        </v-list-item>
      </slot>
      <v-divider />
      <v-list
        v-model:selected="selectedValues"
        select-strategy="leaf"
        density="compact"
      >
        <v-list-item
          v-for="item in sortedItems"
          :key="item.id"
          :title="item.title"
          :value="item.id"
          :active="false"
        >
          <template #prepend="{ isSelected, select }">
            <v-list-item-action start>
              <v-checkbox-btn
                :model-value="isSelected"
                @update:model-value="select"
                density="compact"
              />
            </v-list-item-action>
          </template>
          <template v-if="item.isPreferred" #append>
            <v-icon icon="mdi-star" />
          </template>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>
</template>
<script setup lang="ts" generic="T">
import { computed } from 'vue'
import SelectIcon from '@/components/general/SelectIcon.vue'

interface SelectItem {
  id: string
  title: string
  value: T
  isPreferred?: boolean
}

interface Props {
  label: string
  items: SelectItem[]
  sortItems?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  sortItems: false,
})
const selectedValues = defineModel<T[]>({ required: true })

const sortedItems = computed<SelectItem[]>(() => {
  // Sort items only if selected.
  if (!props.sortItems) return props.items

  return props.items.toSorted((a, b) => {
    if (a.isPreferred && !b.isPreferred) {
      // Preferred items appear at the top.
      return -1
    } else if (!a.isPreferred && b.isPreferred) {
      // Preferred items appear at the top.
      return 1
    } else {
      // Preferred items are sorted by title.
      return a.title.localeCompare(b.title)
    }
  })
})

const allValues = computed<T[]>(() => props.items.map((item) => item.value))
const isAllSelected = computed<boolean>(
  () => selectedValues.value.length === props.items.length,
)
const isSomeSelected = computed<boolean>(
  () => selectedValues.value.length > 0 && !isAllSelected.value,
)

function removeFilterIfEnabled(event: MouseEvent): void {
  // We don't need to do anything if we have no filter defined.
  if (isAllSelected.value) return
  // Otherwise, remove the filter and prevent propagation of the click event so
  // we do not open the menu.
  event.stopPropagation()
  selectAll()
}

function selectAll(): void {
  selectedValues.value = allValues.value
}

function toggleSelectAll(): void {
  if (selectedValues.value.length === allValues.value.length) {
    selectedValues.value = []
  } else {
    selectedValues.value = allValues.value
  }
}
</script>
