<template>
  <v-select
    v-model="selectedCollection"
    :items="collections"
    label="Select a Collection"
    item-title="name"
    item-value="name"
    variant="outlined"
    hide-details
    density="compact"
    return-object
    clearable
    max-width="250"
  >
    <template #append-item>
      <v-divider class="mt-2" />
      <v-list-item
        title="Add New Collection"
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
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="addCollection">Add</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Collection {
  name: string
}

const collections = ref<Collection[]>([])
const selectedCollection = ref<Collection | null>(null)
const dialog = ref(false)
const newCollectionName = ref('')

function addCollection(): void {
  const name = newCollectionName.value.trim()
  if (name && !collections.value.some((c) => c.name === name)) {
    const newItem = { name }
    collections.value.push(newItem)
    selectedCollection.value = newItem
  }
  newCollectionName.value = ''
  dialog.value = false
}
</script>
