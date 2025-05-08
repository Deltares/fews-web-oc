<template>
  <div class="d-flex flex-column overflow-auto">
    <div class="d-flex align-center ga-1 px-2 py-1">
      <span>{{ label }}</span>
      <v-btn
        icon="mdi-refresh"
        variant="plain"
        density="compact"
        @click="clearSelected"
      />
    </div>
    <v-list
      v-model:selected="selected"
      class="overflow-auto flex-1-1"
      select-strategy="leaf"
      border
      rounded
      density="compact"
    >
      <v-list-item
        v-for="item in items"
        :value="getItemValue?.(item) ?? item"
        :title="getItemTitle?.(item) ?? String(item)"
        density="compact"
      />
    </v-list>
  </div>
</template>

<script setup lang="ts" generic="Item, Id, Multiple extends boolean = false">
interface Props {
  items: Item[]
  label: string
  icon?: string
  getItemValue?: (item: Item) => Id
  getItemTitle?: (item: Item) => string
  multiple?: Multiple
}

defineProps<Props>()

type SelectedType = Id extends false ? Item : Id
type Selected = Multiple extends true
  ? SelectedType[]
  : SelectedType | undefined

const selected = defineModel<Selected>({
  required: true,
})

function clearSelected() {
  if (Array.isArray(selected.value)) {
    selected.value = [] as Selected
  } else {
    selected.value = undefined as Selected
  }
}
</script>
