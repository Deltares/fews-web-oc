<template>
  <v-dialog
    v-model="modelValue"
    max-width="640"
    height="60vh"
    class="search-dialog"
    @keydown="onKeydown"
  >
    <v-card rounded="lg" class="search-dialog__card">
      <input
        v-model="searchContext.search"
        type="text"
        autofocus
        :placeholder="searchPlaceholder"
        aria-label="Search"
        class="search-dialog__input"
      />

      <div class="search-dialog__mode-hint text-caption text-medium-emphasis">
        <template v-if="searchMode === 'location'">
          <span class="search-dialog__mode-hint-current">
            <kbd>{{ LOCATION_SEARCH_SHORTCUT }}</kbd>
            Searching locations
          </span>
          <span>Remove {{ LOCATION_SEARCH_SHORTCUT }} to search all groups</span>
        </template>
        <template v-else-if="searchMode === 'topology'">
          <span class="search-dialog__mode-hint-current">
            <kbd>{{ TOPOLOGY_SEARCH_SHORTCUT }}</kbd>
            Searching topology nodes
          </span>
          <span>Remove {{ TOPOLOGY_SEARCH_SHORTCUT }} to search all groups</span>
        </template>
        <template v-else>
          <span>Search all groups</span>
          <span>
            <kbd>{{ LOCATION_SEARCH_SHORTCUT }}</kbd>
            Locations
          </span>
          <span>
            <kbd>{{ TOPOLOGY_SEARCH_SHORTCUT }}</kbd>
            Topology nodes
          </span>
        </template>
      </div>

      <v-divider />

      <div class="search-dialog__results">
        <div
          v-for="group in resultGroups"
          :key="group.type"
          class="search-dialog__group"
          :class="{
            'search-dialog__group--empty': !group.items.length,
          }"
        >
          <v-card
            v-if="group.items.length"
            variant="flat"
            class="search-dialog__group-card flex-1"
          >
            <v-list slim class="search-scroll-container py-0">
              <v-treeview
                v-for="item in group.items"
                :key="item.id"
                :items="[item]"
                item-title="label"
                item-value="id"
                density="compact"
                indent-lines="simple"
                class="py-0"
                :open-all="showAll(item, searchQuery)"
              >
                <template #prepend="{ item: subItem }">
                  <v-icon>{{ iconForItem(subItem) }}</v-icon>
                </template>
                <template #title="{ item: subItem }">
                  <v-list-item-title
                    :class="{
                      'search-dialog__item-title--selected':
                        isSelected(subItem),
                    }"
                    @click.stop="selectItem(subItem)"
                  >
                    <HighlightMatch
                      :value="subItem.label"
                      :query="searchQuery"
                    />
                  </v-list-item-title>
                </template>
              </v-treeview>
            </v-list>
          </v-card>
        </div>
      </div>

      <div
        v-if="!searchResults.length"
        class="pa-8 text-center text-medium-emphasis"
      >
        <v-icon size="40" class="mb-2"> mdi-magnify-close </v-icon>

        <div>No results found</div>
      </div>

      <v-divider />

      <div
        class="d-flex align-center ga-4 px-4 py-2 text-caption text-medium-emphasis"
      >
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          Navigate
        </span>

        <span>
          <kbd>Enter</kbd>
          Open
        </span>

        <span>
          <kbd>Esc</kbd>
          Close
        </span>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { useSearchContext } from '@/stores/searchContext'
import type { SearchItem } from '@/stores/searchContext'
import { containsSubstring } from '@/lib/search'
import HighlightMatch from '@/components/general/HighlightMatch.vue'

const modelValue = defineModel({
  type: Boolean,
  required: true,
})

const router = useRouter()
const searchContext = useSearchContext()

const LOCATION_SEARCH_SHORTCUT = '@' as const
const TOPOLOGY_SEARCH_SHORTCUT = '#' as const

const selectedIndex = ref(0)
type SearchMode = 'location' | 'topology'
const searchMode = computed<SearchMode | undefined>(() => {
  const firstCharacter = searchContext.search.charAt(0)
  if (firstCharacter === LOCATION_SEARCH_SHORTCUT) return 'location'
  if (firstCharacter === TOPOLOGY_SEARCH_SHORTCUT) return 'topology'
  return undefined
})

const searchPlaceholder = computed(() => {
  if (searchMode.value === 'location') return 'Search locations...'
  if (searchMode.value === 'topology') return 'Search topology nodes...'
  return `Search... (${LOCATION_SEARCH_SHORTCUT} locations, ${TOPOLOGY_SEARCH_SHORTCUT} topology)`
})

const debouncedSearch = refDebounced(
  computed(() => searchContext.search),
  100,
)

const searchQuery = computed(() => {
  const value = debouncedSearch.value.trim()
  return searchMode.value ? value.slice(1).trim() : value
})

const filteredItems = computed(() => {
  const items = searchMode.value
    ? searchContext.items.filter((item) => item.type === searchMode.value)
    : searchContext.items
  const query = searchQuery.value
  if (!query) return items

  return items.filter((item) => isMatchingItem(item, query))
})

const locationItems = computed(() =>
  filteredItems.value.filter((item) => item.type === 'location'),
)

const topologyItems = computed(() =>
  filteredItems.value.filter((item) => item.type === 'topology'),
)

const resultGroups = computed(() => [
  {
    type: 'topology',
    items: topologyItems.value,
  },
  {
    type: 'location',
    items: locationItems.value,
  },
])

const searchResults = computed(() =>
  resultGroups.value.flatMap((group) =>
    group.items.flatMap((item) => flattenItems(item)),
  ),
)

function flattenItems(item: SearchItem): SearchItem[] {
  return [item, ...(item.children?.flatMap(flattenItems) ?? [])]
}

function isMatchingItem(item: SearchItem, query: string): boolean {
  return (
    containsSubstring(item.label, query) ||
    item.children?.some((child) => isMatchingItem(child, query)) === true
  )
}

function showAll(item: SearchItem, query: string): boolean {
  return Boolean(
    (query && item.children?.some((child) => isMatchingItem(child, query))) ||
    item.children?.some(
      (child) => isSelected(child) || hasSelectedChild(child),
    ),
  )
}

function hasSelectedChild(item: SearchItem): boolean {
  return (
    item.children?.some(
      (child) => isSelected(child) || hasSelectedChild(child),
    ) === true
  )
}

function isSelected(item: SearchItem): boolean {
  return searchResults.value[selectedIndex.value]?.id === item.id
}

function iconForItem(item: SearchItem): string {
  return item.type === 'user'
    ? 'mdi-account'
    : item.type === 'project'
      ? 'mdi-folder'
      : item.type === 'document'
        ? 'mdi-file-document'
        : item.type === 'topology'
          ? 'mdi-file-tree'
          : 'mdi-map-marker'
}

/**
 * Each search item type defines how its params become a route.
 *
 * Keeping this mapping in one place makes adding new search types easy.
 */
const routeFactories: Record<
  SearchItem['type'],
  (params: SearchItem['params']) => ReturnType<typeof router.resolve>
> = {
  user: (params) =>
    router.resolve({
      name: 'user',
      params: {
        id: params.id,
      },
    }),

  project: (params) =>
    router.resolve({
      name: 'project',
      params: {
        id: params.id,
      },
    }),

  document: (params) =>
    router.resolve({
      name: 'document',
      params: {
        id: params.id,
      },
    }),

  location: (params) =>
    router.resolve({
      name: 'SpatialDisplayWithLocation',
      params: {
        locationId: params.locationId,
      },
    }),

  topology: (params) =>
    router.resolve({
      name: 'TopologyDisplay',
      params: {
        topologyId: params.topologyId,
        nodeId: params.nodeId,
      },
    }),
}

function routeForItem(item: SearchItem) {
  return routeFactories[item.type](item.params)
}

function selectItem(item: SearchItem) {
  router.push(routeForItem(item))
  modelValue.value = false
}

function close() {
  modelValue.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (!modelValue.value) {
    return
  }

  const items = searchResults.value

  if (event.key === 'ArrowDown') {
    event.preventDefault()

    if (items.length) {
      selectedIndex.value = (selectedIndex.value + 1) % items.length
    }
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()

    if (items.length) {
      selectedIndex.value =
        (selectedIndex.value - 1 + items.length) % items.length
    }
  }

  if (event.key === 'Enter') {
    event.preventDefault()

    const item = items[selectedIndex.value]

    if (item) {
      selectItem(item)
    }
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(
  () => searchContext.search,
  () => {
    selectedIndex.value = 0
  },
)

watch(filteredItems, () => {
  selectedIndex.value = 0
})

watch(modelValue, (value) => {
  if (!value) {
    selectedIndex.value = 0
  }
})
</script>

<style scoped>
.search-dialog:not(.v-dialog--fullscreen) {
  height: 60vh;
}

.search-dialog__card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-dialog__input {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 100%;
  min-height: 56px;
  padding: 8px 16px;
  border: 0;
  outline: none;
  color: inherit;
  background: transparent;
  font: inherit;
}

.search-dialog__input::placeholder {
  color: rgb(var(--v-theme-on-surface), 0.6);
}

.search-dialog__results {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-dialog__group {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-dialog__group--empty {
  flex: 0 0 auto;
}

.search-dialog__group-card {
  min-height: 0;
  flex: 1;
  margin: 0 8px 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-dialog__group-card .search-scroll-container {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.search-dialog__item-title--selected {
  background-color: rgb(var(--v-theme-primary), 0.12);
}

.search-dialog__mode-hint {
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 28px;
  padding: 0 16px 4px;
}

.search-dialog__mode-hint span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.search-dialog__mode-hint-current {
  color: rgb(var(--v-theme-primary));
}
</style>
