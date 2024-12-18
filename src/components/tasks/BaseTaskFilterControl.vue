<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-chip
        variant="tonal"
        :color="isAllSelected ? undefined : 'primary'"
        v-bind="props"
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
      </v-chip>
    </template>
    <v-card min-height="300" height="50dvh">
      <v-card-text class="h-100 d-flex flex-column gr-2">
        <div class="flex-0-0 d-flex flex-row justify-space-between">
          <v-btn @click="selectAll">Select all</v-btn>
          <v-btn @click="selectNone">Select none</v-btn>
        </div>
        <div class="flex-0-0">
          <slot name="actions"></slot>
        </div>
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
      </v-card-text>
    </v-card>
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

function selectNone(): void {
  selectedValues.value = []
}
</script>
