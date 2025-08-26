<template>
  <v-dialog
    v-model="state.active"
    transition="dialog-top-transition"
    :fullscreen="mobile"
    scrollable
    :max-width="mobile ? undefined : '900'"
    class="align-start"
    @keydown.esc="state.active = false"
  >
    <v-card>
      <v-card-title class="pa-0">
        <v-toolbar density="compact">
          <v-text-field
            v-model="search"
            placeholder="Search for locations"
            variant="outlined"
            hide-details
            clearable
            density="compact"
            autofocus
            prepend-icon="mdi-map-marker"
            class="ps-3"
          />
          <v-btn icon="mdi-close" @click="state.active = false" />
        </v-toolbar>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-treeview
          v-model:selected="state.selectedItems"
          :items="state.items"
          item-value="id"
          :select-strategy="cascadeStrategy"
          selectable
          density="compact"
          :custom-filter="isMatchingItem"
          :search="search"
          open-all
        >
          <template #title="{ item }">
            <HighlightMatch :value="item.title" :query="search" />
            <span class="id-match" v-if="showId(item)">
              ID: <HighlightMatch :value="item.id" :query="search" />
            </span>
          </template>
        </v-treeview>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

import { containsSubstring } from '@/lib/search'

import {
  type GlobalSearchItem,
  useGlobalSearchState,
} from '@/stores/globalSearch'

import HighlightMatch from './HighlightMatch.vue'
import { cascadeStrategy } from '@/lib/selection'

const { mobile } = useDisplay()
const state = useGlobalSearchState()
const search = ref<string | undefined>()

function showId(item: GlobalSearchItem): boolean {
  const query = search.value
  if (!query) return false

  const isMatchingName = containsSubstring(item.title, query)
  const isMatchingId = containsSubstring(item.id, query)
  // Only show the ID if the search query matches the ID but not the name.
  return isMatchingId && !isMatchingName
}

function isMatchingItem(
  _id: string,
  query: string,
  item?: { raw: GlobalSearchItem },
): boolean {
  // A location matches if name and/or ID contains a substring that matches the
  // query.
  const isMatchingId = item ? containsSubstring(item.raw.id, query) : false
  const isMatchingName = item ? containsSubstring(item.raw.title, query) : false
  return isMatchingId || isMatchingName
}
</script>

<style scoped>
.id-match {
  margin-left: 20px;
  font-size: 0.8em;
  font-style: italic;
}
</style>
