<template>
  <!-- @vue-expect-error: selectedIds type is not based on item-value causing error -->
  <v-autocomplete
    v-model="selected"
    :items="items"
    :item-value="getItemValue"
    :item-title="getItemTitle"
    :label="label"
    clearable
    density="compact"
    variant="outlined"
    :multiple
    hide-details
    :prepend-icon="icon"
    class="pa-3"
  >
    <template #selection="{ item, index }">
      <span v-if="index < 3">{{ item.title }}</span>
      <span v-else-if="index === 3 && Array.isArray(selected)">
        ... ({{ selected.length }} selected)
      </span>
    </template>
    <template #append-inner>
      <v-chip>{{ items.length }}</v-chip>
    </template>
  </v-autocomplete>
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
</script>
