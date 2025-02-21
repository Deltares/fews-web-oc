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
        <v-toolbar class="px-1" density="compact">
          <v-text-field
            v-model="search"
            placeholder="Search for locations"
            variant="outlined"
            hide-details
            clearable
            density="compact"
            autofocus
          >
            <template v-slot:prepend-inner>
              <v-btn icon size="small">
                <v-icon>mdi-map-marker</v-icon>
              </v-btn>
            </template>
          </v-text-field>
          <v-btn icon="mdi-close" @click="state.active = false" />
        </v-toolbar>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-data-iterator
          :custom-filter="isMatchingItem"
          :items="state.items"
          :items-per-page="200"
          :search="search"
        >
          <template v-slot:header> </template>
          <template v-slot:default="{ items }">
            <v-list density="compact">
              <v-list-item
                v-for="item in items"
                :key="item.raw.id"
                @click="itemClick(item.raw)"
              >
                <HighlightMatch :value="item.raw.name" :query="search" />
                <span class="id-match" v-if="showId(item.raw)">
                  ID: <HighlightMatch :value="item.raw.id" :query="search" />
                </span>
              </v-list-item>
            </v-list>
          </template>
          <template v-slot:footer="{ items }">
            <v-list-item color="primary" v-if="items.length === 200">
              + {{ state.items.length - 200 }} more locations</v-list-item
            >
          </template>
        </v-data-iterator>
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

const { mobile } = useDisplay()
const state = useGlobalSearchState()
const search = ref<string | undefined>()

function itemClick(item: any) {
  state.selectedItem = item
  state.active = false
}

function showId(item: GlobalSearchItem): boolean {
  const query = search.value
  if (!query) return false

  const isMatchingName = containsSubstring(item.name, query)
  const isMatchingId = containsSubstring(item.id, query)
  // Only show the ID if the search query matches the ID but not the name.
  return isMatchingId && !isMatchingName
}

function isMatchingItem(
  id: string,
  query: string,
  item?: { raw: GlobalSearchItem },
): boolean {
  // A location matches if name and/or ID contains a substring that matches the
  // query.
  const isMatchingId = containsSubstring(id, query)
  const isMatchingName = item ? containsSubstring(item.raw.name, query) : false
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
