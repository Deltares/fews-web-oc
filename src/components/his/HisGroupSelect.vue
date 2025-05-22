<template>
  <div class="d-flex flex-column overflow-auto">
    <div class="d-flex align-center ga-1 px-2 py-1">
      <span>{{ label }}</span>
      <v-btn
        icon="mdi-refresh"
        variant="plain"
        density="compact"
        @click="clearSelection"
      />
      <v-spacer />
      <slot name="append-title" />
    </div>
    <v-list
      v-model:selected="listSelected"
      class="overflow-auto flex-1-1 py-0"
      :select-strategy="multiple ? 'leaf' : undefined"
      border
      rounded
      density="compact"
    >
      <div
        v-for="(groupItems, groupKey, index) in groupedItems"
        :key="groupKey"
      >
        <v-list-group density="compact" class="grouped-select-list">
          <template #activator="{ props, isOpen }">
            <!-- Group Header -->
            <v-list-item
              :title="getItemGroupTitle(groupItems[0])"
              density="compact"
              v-bind="props"
            >
              <template v-if="multiple" #prepend>
                <v-list-item-action start>
                  <v-checkbox-btn
                    @click.stop="() => toggleGroup(groupKey)"
                    :indeterminate="isGroupIndeterminate(groupKey)"
                    :model-value="isGroupSelected(groupKey)"
                    density="compact"
                  />
                </v-list-item-action>
              </template>
              <template #append>
                <v-list-item-action end>
                  <v-icon
                    :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  />
                </v-list-item-action>
              </template>
            </v-list-item>
            <v-divider v-if="isOpen" />
          </template>

          <!-- Group Items -->
          <v-list-item
            v-for="item in groupItems"
            density="compact"
            :title="getItemTitle(item)"
            :value="getItemValue(item)"
          >
            <template v-if="multiple" #prepend="{ isSelected }">
              <v-list-item-action start>
                <v-checkbox-btn :model-value="isSelected" density="compact" />
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-divider
            v-if="
              groupItems.length && index < Object.keys(groupedItems).length - 1
            "
          />
        </v-list-group>
      </div>
    </v-list>
  </div>
</template>

<script setup lang="ts" generic="Item, Id, Multiple extends boolean = false">
import { computed } from 'vue'

interface Props {
  items: Item[]
  label: string
  getItemValue: (item: Item) => Id
  getItemTitle: (item: Item) => string
  getItemGroupTitle: (name: Item) => string
  groupBy: (item: Item) => string
  multiple?: Multiple
}

const props = defineProps<Props>()

type Selected = Multiple extends true ? Id[] : Id | undefined

const selected = defineModel<Selected>({
  required: true,
})

const listSelected = computed({
  get: () => {
    if (props.multiple) {
      return selected.value as NonNullable<Selected>[]
    } else {
      return selected.value ? [selected.value] : []
    }
  },
  set: (value) => {
    if (props.multiple) {
      selected.value = value as Selected
    } else {
      selected.value = value.length ? value[0] : (undefined as Selected)
    }
  },
})

const groupedItems = computed(() =>
  props.items.reduce<Record<string, Item[]>>((acc, item) => {
    const group = props.groupBy(item)
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {}),
)

function isGroupSelected(group: string): boolean {
  const ids = getIds(group)
  return props.multiple
    ? ids.every((id) => (selected.value as Id[]).includes(id))
    : ids.some((id) => id === selected.value)
}

function isGroupIndeterminate(group: string): boolean {
  const ids = getIds(group)
  const selectedCount = props.multiple
    ? ids.filter((id) => (selected.value as Id[]).includes(id)).length
    : -1
  return selectedCount > 0 && selectedCount < ids.length
}

function toggleGroup(group: string) {
  if (!props.multiple) return

  const ids = getIds(group)
  const selectedIds = selected.value as Id[]
  const newSelected = isGroupSelected(group)
    ? selectedIds.filter((id) => !ids.includes(id))
    : Array.from(new Set([...selectedIds, ...ids]))
  selected.value = newSelected as Selected
}

function getIds(group: string): Id[] {
  return groupedItems.value[group].map(props.getItemValue)
}

function clearSelection() {
  if (props.multiple) {
    selected.value = [] as Selected
  } else {
    selected.value = undefined as Selected
  }
}
</script>

<style>
.grouped-select-list {
  --prepend-width: 0px;
}
</style>
