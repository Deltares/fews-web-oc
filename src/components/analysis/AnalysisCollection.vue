<template>
  <v-select
    v-model="selectedCollectionName"
    :items="collections.map((c) => c.name)"
    label="Collection"
    item-title="name"
    item-value="name"
    variant="outlined"
    hide-details
    density="compact"
    max-width="250"
  >
    <template #append-item>
      <v-divider class="mt-2" />
      <v-list-item
        title="New Collection"
        @click="dialog = true"
        prepend-icon="mdi-plus"
      />
    </template>
  </v-select>

  <v-dialog v-model="dialog" max-width="400px">
    <v-card>
      <v-card-title>Add New Collection</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newCollectionName"
          label="Collection Name"
          autofocus
          @keyup.enter="addCollection"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="dialog = false">Cancel</v-btn>
        <v-btn :disabled="!canAddName" variant="tonal" @click="addCollection">
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { createCollection, type Collection } from '@/lib/analysis'
import { DataAnalysisDisplayElement } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'

interface Props {
  config: DataAnalysisDisplayElement
  collections: Collection[]
}
const props = defineProps<Props>()

const selectedCollectionName = defineModel<string>('selectedCollectionName')
const dialog = ref(false)
const newCollectionName = ref('')

const canAddName = computed(() => {
  const name = newCollectionName.value.trim()
  return name && !props.collections.some((c) => c.name === name)
})

function addCollection(): void {
  const name = newCollectionName.value.trim()
  if (canAddName.value) {
    const newItem = createCollection(name, props.config)
    props.collections.push(newItem)
    selectedCollectionName.value = newItem.name
  }
  newCollectionName.value = ''
  dialog.value = false
}
</script>
