<template>
  <div class="d-flex flex-column overflow-auto">
    <v-toolbar height="32">
      <span class="ms-2">{{ label }}</span>
      <slot name="prepend-title" />
      <v-btn
        v-show="multiple && listSelected.length > 0"
        icon="mdi-refresh"
        variant="plain"
        density="compact"
        @click="clearSelected"
      />
      <v-spacer />
      <slot name="append-title" />
    </v-toolbar>
    <slot name="prepend" />
    <v-list
      v-model:selected="listSelected"
      class="overflow-auto flex-1-1 py-0"
      :select-strategy="multiple ? 'leaf' : undefined"
      border
      rounded
      density="compact"
    >
      <v-list-item
        v-for="item in items"
        :value="getItemValue?.(item) ?? item"
        :title="getItemTitle?.(item) ?? String(item)"
        :lines="false"
        density="compact"
      >
        <template v-if="multiple" #prepend="{ isSelected, select }">
          <v-list-item-action start>
            <v-checkbox-btn
              :model-value="isSelected"
              @update:model-value="select"
              density="compact"
            />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts" generic="Item, Id, Multiple extends boolean = false">
import { computed } from 'vue'

interface Props {
  items: Item[]
  label: string
  icon?: string
  getItemValue?: (item: Item) => Id
  getItemTitle?: (item: Item) => string
  multiple?: Multiple
}

const props = defineProps<Props>()

type SelectedType = Id extends false ? Item : Id
type Selected = Multiple extends true
  ? SelectedType[]
  : SelectedType | undefined

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

function clearSelected() {
  if (Array.isArray(selected.value)) {
    selected.value = [] as Selected
  } else {
    selected.value = undefined as Selected
  }
}
</script>
