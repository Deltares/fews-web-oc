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
      <div class="d-flex px-1 pt-3 pb-2 align-center">
        <span class="pe-1">Filter:</span>
        <v-btn-toggle density="compact" v-model="showOnlySelected">
          <v-btn variant="tonal" :value="false">All </v-btn>
          <v-btn variant="tonal" :value="true">Selected </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn
          prepend-icon="mdi-close-circle"
          variant="tonal"
          rounded
          @click.stop="state.selectedItems = []"
          >Clear all</v-btn
        >
      </div>
      <v-list slim class="search-scroll-container py-0">
        <v-virtual-scroll :items="filteredNodes" item-key="id" item-height="40">
          <template #default="{ item }">
            <v-treeview
              :selected="selectedChildren(item)"
              :items="[item]"
              item-value="id"
              :select-strategy="cascadeStrategy"
              selectable
              density="compact"
              indent-lines="simple"
              class="py-0"
              @update:selected="
                (selection) => updateSelectedChildren(item, selection)
              "
              :key="item.id"
            >
              <template #title="{ item: subItem }">
                <HighlightMatch :value="subItem.title" :query="search" />
                <span class="id-match" v-if="showId(subItem)">
                  ID: <HighlightMatch :value="subItem.id" :query="search" />
                </span>
              </template>
            </v-treeview>
          </template>
        </v-virtual-scroll>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import { containsSubstring } from '@/lib/search'

import { GlobalSearchItem, useGlobalSearchState } from '@/stores/globalSearch'

import HighlightMatch from './HighlightMatch.vue'
import { cascadeStrategy } from '@/lib/selection'
import { debouncedRef } from '@vueuse/core'

const { mobile } = useDisplay()
const state = useGlobalSearchState()
const search = ref<string>()
const debouncedSearch = debouncedRef(search, 100)
const showOnlySelected = ref(false)

const filteredNodes = computed(() => {
  // Filter log messages based on selected levels, types, search text, task runs, and workflows
  // We filter in two passes, first we find which taskRuns have any logs that match the filter criteria
  // and then we filter the log messages based on those taskRuns.

  const items = showOnlySelected.value
    ? state.items.filter((item) => {
        const childIds = item.children?.flatMap((child) => child.id) || []
        const allIds = childIds.concat(item.id)
        return allIds.some((id) => state.selectedItems.includes(id))
      })
    : state.items

  const searchString = debouncedSearch.value
  if (searchString === undefined || searchString.trim() === '') {
    return items
  }

  return items.filter((node) => isMatchingItem(node, searchString))
})

function showId(item: GlobalSearchItem): boolean {
  const query = search.value
  if (!query) return false

  const isMatchingName = containsSubstring(item.title, query)
  const isMatchingId = containsSubstring(item.id, query)
  // Only show the ID if the search query matches the ID but not the name.
  return isMatchingId && !isMatchingName
}

function selectedChildren(item: GlobalSearchItem) {
  const childIds = item.children?.flatMap((child) => child.id) || []
  const allIds = childIds.concat(item.id)
  return state.selectedItems.filter((id) => allIds.includes(id))
}

function updateSelectedChildren(item: GlobalSearchItem, selection: unknown) {
  const childIds = item.children?.flatMap((child) => child.id) || []
  const allIds = childIds.concat(item.id)
  // Remove any previously selected child IDs of this item.
  const filtered = state.selectedItems.filter((id) => !allIds.includes(id))
  // Add the newly selected child IDs.
  state.selectedItems = filtered.concat(selection as string[])
}

function isMatchingItem(item: GlobalSearchItem, query: string): boolean {
  // A location matches if name and/or ID contains a substring that matches the
  // query.
  const isMatchingId = item ? containsSubstring(item.id, query) : false
  const isMatchingName = item ? containsSubstring(item.title, query) : false
  return isMatchingId || isMatchingName
}
</script>

<style scoped>
.id-match {
  margin-left: 20px;
  font-size: 0.8em;
  font-style: italic;
}

.search-scroll-container {
  display: flex;
  height: calc(100vh - 48px);
  overflow-y: hidden;
}
</style>
