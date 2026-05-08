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
    <template #item="{ item, props }">
      <v-list-item v-bind="props" :title="item.title">
        <template #append>
          <v-dialog max-width="400">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-delete" size="small" />
            </template>
            <template #default="{ isActive }">
              <v-card
                title="Delete Collection"
                text="Are you sure you want to delete this collection?"
              >
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    variant="flat"
                    color="primary"
                    @click="isActive.value = false"
                    text="cancel"
                  />
                  <v-btn
                    text="delete"
                    @click="
                      (deleteCollection(item.value), (isActive.value = false))
                    "
                  />
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </template>
      </v-list-item>
    </template>

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

function deleteCollection(collectionName: string) {
  const index = props.collections.findIndex((c) => c.name === collectionName)
  if (index === -1) return

  props.collections.splice(index, 1)

  if (props.collections.length === 0) {
    const newCollection = createCollection('Default', props.config)
    props.collections.push(newCollection)
    selectedCollectionName.value = newCollection.name
  }
}
</script>
