<template>
  <!-- @vue-expect-error: selectedIds type is not based on item-value causing error -->
  <v-autocomplete
    v-model="selectedIds"
    :items="items"
    :item-value="getItemValue"
    :item-title="getItemTitle"
    :label="label"
    clearable
    density="compact"
    variant="outlined"
    multiple
    hide-details
    :prepend-icon="icon"
    class="pa-4"
  >
    <template #selection="{ item, index }">
      <span v-if="index < 3">{{ item.title }}</span>
      <span v-else-if="index === 3">
        ... ({{ selectedIds.length }} selected)
      </span>
    </template>
    <template #append-inner>
      <v-chip>{{ items.length }}</v-chip>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts" generic="T, K">
interface Props {
  items: T[]
  label: string
  icon?: string
  getItemValue?: (item: T) => K
  getItemTitle?: (item: T) => string
}

defineProps<Props>()

type SelectedType = K extends false ? T : K

const selectedIds = defineModel<SelectedType[]>('selectedIds', {
  required: true,
})
</script>
