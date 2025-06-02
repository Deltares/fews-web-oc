<template>
  <v-select
    v-model="selectedCollection"
    :items="collections"
    label="Collection"
    item-title="name"
    item-value="name"
    variant="outlined"
    hide-details
    density="compact"
    return-object
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
        <v-btn variant="tonal" @click="addCollection">Add</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { createCollection, type Collection } from '@/lib/analysis'
import { ref } from 'vue'

const selectedCollection = defineModel<Collection>('selectedCollection')
const collections = defineModel<Collection[]>('collections', {
  required: true,
})
const dialog = ref(false)
const newCollectionName = ref('')

function addCollection(): void {
  const name = newCollectionName.value.trim()
  if (name && !collections.value.some((c) => c.name === name)) {
    const newItem = createCollection(name)
    collections.value.push(newItem)
    selectedCollection.value = newItem
  }
  newCollectionName.value = ''
  dialog.value = false
}
</script>
