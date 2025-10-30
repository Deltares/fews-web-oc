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
      <v-list slim class="search-scroll-container py-0">
        <v-virtual-scroll
          :items="filteredNodes"
          :item-size="36"
          item-key="__uid"
        >
          <template #default="{ item }">
            <v-list-item density="compact" class="py-0">
              <template v-slot:prepend="{ isSelected, select }">
                <v-list-item-action start>
                  <v-checkbox-btn
                    :model-value="isSelected"
                    @update:model-value="select"
                  ></v-checkbox-btn>
                </v-list-item-action>
              </template>
              <HighlightMatch :value="item.title" :query="search" />
              <span class="id-match" v-if="showId(item)">
                ID:
                <HighlightMatch :value="item.id.toString()" :query="search" />
              </span>
            </v-list-item>
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

import { useGlobalSearchState } from '@/stores/globalSearch'

import HighlightMatch from './HighlightMatch.vue'
import { cascadeStrategy } from '@/lib/selection'
import { debouncedRef } from '@vueuse/core'

interface TreeNode {
  id?: string | number
  title?: string
  subtitle?: string
  children?: TreeNode[]
  expanded?: boolean
  [key: string]: any
}

interface FlatNode {
  _uid: string | number
  id: string | number
  title: string
  subtitle?: string
  depth: number
  hasChildren: boolean
  raw: TreeNode
  path: Array<string | number>
}

const { mobile } = useDisplay()
const state = useGlobalSearchState()
const search = ref<string>()
const debouncedSearch = debouncedRef(search, 100)

const visibleNodes = computed<FlatNode[]>(() => flattenTree(state.items))

const filteredNodes = computed(() => {
  // Filter log messages based on selected levels, types, search text, task runs, and workflows
  // We filter in two passes, first we find which taskRuns have any logs that match the filter criteria
  // and then we filter the log messages based on those taskRuns.

  const searchString = debouncedSearch.value
  if (searchString === undefined || searchString.trim() === '') {
    return visibleNodes.value
  }

  return visibleNodes.value.filter((node) =>
    isMatchingItem(node.id.toString(), searchString, node),
  )
})

function showId(item: FlatNode): boolean {
  const query = search.value
  if (!query) return false

  const isMatchingName = containsSubstring(item.title, query)
  const isMatchingId = containsSubstring(item._uid.toString(), query)
  // Only show the ID if the search query matches the ID but not the name.
  return isMatchingId && !isMatchingName
}

function isMatchingItem(id: string, query: string, item?: FlatNode): boolean {
  // A location matches if name and/or ID contains a substring that matches the
  // query.
  const isMatchingId = item ? containsSubstring(id, query) : false
  const isMatchingName = item ? containsSubstring(item.title, query) : false
  return isMatchingId || isMatchingName
}

let __uid = 1
function makeUid(): string {
  return `vt-${__uid++}`
}

function flattenTree(
  nodes: TreeNode[],
  depth = 0,
  parentPath: Array<string | number> = [],
): FlatNode[] {
  const out: FlatNode[] = []
  for (const node of nodes) {
    const id = node.id ?? makeUid()
    const title = node.title ?? ''
    const children = Array.isArray(node.children)
      ? (node.children as TreeNode[])
      : []
    const hasChildren = children.length > 0

    const flat: FlatNode = {
      _uid: id,
      id,
      title,
      subtitle: node.subtitle,
      depth,
      hasChildren,
      raw: node,
      path: [...parentPath, id],
    }

    out.push(flat)

    if (hasChildren) {
      out.push(...flattenTree(children, depth + 1, flat.path))
    }
  }
  return out
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
