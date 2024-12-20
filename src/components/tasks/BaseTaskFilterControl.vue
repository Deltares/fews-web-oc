<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-chip
        variant="tonal"
        pilled
        label
        :color="isAllSelected ? undefined : 'primary'"
        v-bind="props"
        class="mx-1"
      >
        <template #prepend>
          <v-btn
            class="mr-2"
            size="20"
            variant="plain"
            :icon="isAllSelected ? 'mdi-filter-plus' : 'mdi-filter-remove'"
            @click="removeFilterIfEnabled"
          />
        </template>
        {{ label }}
        <v-icon>mdi-chevron-down</v-icon>
      </v-chip>
    </template>
    <v-sheet min-height="300" height="50dvh">
      <v-banner sticky density="compact" class="pa-2">
        <v-btn
          @click="toggleSelectAll"
          :icon="selectAllIcon"
          variant="plain"
        ></v-btn>
        <slot name="actions"></slot>
      </v-banner>
      <v-list
        class="flex-1-1 overflow-auto"
        v-model:selected="selectedValues"
        select-strategy="leaf"
      >
        <v-list-item
          v-for="item in sortedItems"
          :key="item.id"
          :title="item.title"
          :value="item.value"
        >
          <template #prepend="{ isSelected }">
            <v-list-item-action start>
              <v-checkbox-btn :model-value="isSelected" />
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

interface SelectItem {
  id: string
  title: string
  value: T
  isPreferred?: boolean
}

interface Props {
  label: string
  items: SelectItem[]
  doSortItems?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  doSortItems: false,
})
const selectedValues = defineModel<T[]>({ required: true })

const sortedItems = computed<SelectItem[]>(() => {
  // Sort items only if selected.
  if (!props.doSortItems) return props.items

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

const selectAllIcon = computed(() => {
  if (selectedValues.value.length === 0) {
    return 'mdi-checkbox-blank-outline'
  }
  if (selectedValues.value.length === allValues.value.length) {
    return 'mdi-close-box'
  }
  return 'mdi-minus-box' // 'mdi-checkbox-marked' // 'mdi-minus-box'
})
</script>
