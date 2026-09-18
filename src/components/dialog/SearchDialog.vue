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
        ref="searchInput"
        v-model="searchContext.search"
        type="text"
        autofocus
        :placeholder="searchPlaceholder"
        aria-label="Search"
        class="search-dialog__input"
        @keydown.enter.stop.prevent="selectSelectedItem"
      />

      <div class="search-dialog__mode-hint text-caption text-medium-emphasis">
        <template v-if="searchMode === 'location'">
          <span class="search-dialog__mode-hint-current">
            <kbd>{{ LOCATION_SEARCH_SHORTCUT }}</kbd>
            Searching locations
          </span>
          <span>Remove {{ LOCATION_SEARCH_SHORTCUT }} to search for anything</span>
        </template>
        <template v-else-if="searchMode === 'route'">
          <span class="search-dialog__mode-hint-current">
            <kbd>{{ ROUTE_SEARCH_SHORTCUT }}</kbd>
            Searching routes
          </span>
          <span>Remove {{ ROUTE_SEARCH_SHORTCUT }} to search for anything</span>
        </template>
        <template v-else>
          <span>Search all groups</span>
          <span>
            <kbd>{{ LOCATION_SEARCH_SHORTCUT }}</kbd>
            Locations
          </span>
          <span>
            <kbd>{{ ROUTE_SEARCH_SHORTCUT }}</kbd>
            Routes
          </span>
        </template>
      </div>

      <v-divider />

      <div class="search-dialog__results">
        <v-card variant="flat" class="search-dialog__tree-card">
          <div
            ref="searchResultsContainer"
            class="search-dialog__scroll-container"
          >
            <v-list slim class="search-scroll-container py-0">
            <v-treeview
              :items="treeItems"
              item-title="label"
              item-value="id"
              density="compact"
              indent-lines="simple"
              class="py-0"
              open-all
            >
              <template #prepend="{ item: subItem }">
                <v-icon v-if="subItem.type === 'group'">
                  {{
                    subItem.id === 'topology'
                      ? 'mdi-directions'
                      : 'mdi-map-marker'
                  }}
                </v-icon>
                <v-img
                  v-else-if="subItem.type === 'location' && subItem.iconName"
                  :src="getResourcesIconsUrl(subItem.iconName)"
                    width="16"
                    height="16"
                  contain
                />
                <v-icon
                  v-else-if="subItem.type === 'topology' && subItem.iconName"
                >
                  {{ subItem.iconName }}
                </v-icon>
                <v-icon v-else>{{ iconForTreeItem(subItem) }}</v-icon>
              </template>
              <template #title="{ item: subItem }">
                <v-list-item-title
                  :data-search-item-id="subItem.id"
                  :class="{
                    'search-dialog__group-title': subItem.type === 'group',
                    'search-dialog__item-title--selected':
                      subItem.type !== 'group' && isSelectedTreeItem(subItem),
                  }"
                  @click.stop="
                    subItem.type === 'group'
                      ? undefined
                      : selectTreeItem(subItem)
                  "
                >
                  <span v-if="subItem.type === 'group'">{{
                    subItem.label
                  }}</span>
                  <HighlightMatch
                    v-else
                    :value="subItem.label"
                    :query="searchQuery"
                  />
                  <span
                    v-if="subItem.type === 'topology'"
                    class="search-dialog__route-path"
                  >
                    {{ routeForItem(subItem).fullPath }}
                  </span>
                </v-list-item-title>
              </template>
            </v-treeview>
            </v-list>
          </div>
        </v-card>
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
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { useSearchContext } from '@/stores/searchContext'
import type { SearchItem } from '@/stores/searchContext'
import { containsSubstring } from '@/lib/search'
import HighlightMatch from '@/components/general/HighlightMatch.vue'
import { getResourcesIconsUrl } from '@/lib/fews-config'

const modelValue = defineModel({
  type: Boolean,
  required: true,
})

const router = useRouter()
const searchContext = useSearchContext()
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const searchResultsContainer =
  useTemplateRef<HTMLDivElement>('searchResultsContainer')

const LOCATION_SEARCH_SHORTCUT = '@' as const
const ROUTE_SEARCH_SHORTCUT = '#' as const

const selectedIndex = ref(0)
type SearchMode = 'location' | 'route'
const searchMode = computed<SearchMode | undefined>(() => {
  const firstCharacter = searchContext.search.charAt(0)
  if (firstCharacter === LOCATION_SEARCH_SHORTCUT) return 'location'
  if (firstCharacter === ROUTE_SEARCH_SHORTCUT) return 'route'
  return undefined
})

const searchPlaceholder = computed(() => {
  if (searchMode.value === 'location') return 'Search locations...'
  if (searchMode.value === 'route') return 'Search routes...'
  return `Search... (${LOCATION_SEARCH_SHORTCUT} locations, ${ROUTE_SEARCH_SHORTCUT} routes)`
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
    ? searchContext.items.filter((item) =>
        searchMode.value === 'location'
          ? item.type === 'location'
          : item.type === 'topology',
      )
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

interface SearchGroupItem {
  id: string
  label: string
  type: 'group'
  iconName?: string
  children: SearchItem[]
}

type SearchTreeItem = SearchItem | SearchGroupItem

const treeItems = computed<SearchTreeItem[]>(() => {
  const groups = searchMode.value
    ? resultGroups.value.filter((group) =>
        searchMode.value === 'location'
          ? group.type === 'location'
          : group.type === 'topology',
      )
    : resultGroups.value

  return groups.map((group) => ({
    id: group.type,
    label: group.type === 'topology' ? 'Routes' : 'Locations',
    type: 'group',
    children: group.items,
  }))
})

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

function isSelected(item: SearchItem): boolean {
  return searchResults.value[selectedIndex.value]?.id === item.id
}

function isSelectedTreeItem(item: SearchTreeItem): boolean {
  return item.type !== 'group' && isSelected(item)
}

function selectTreeItem(item: SearchTreeItem): void {
  if (item.type !== 'group') selectItem(item)
}

function iconForTreeItem(item: SearchTreeItem): string {
  return item.type === 'group' ? 'mdi-map-marker' : iconForItem(item)
}

function iconForItem(item: SearchItem): string {
  switch (item.type) {
    case 'user':
      return 'mdi-account'
    case 'project':
      return 'mdi-folder'
    case 'document':
      return 'mdi-file-document'
    case 'topology':
      return 'mdi-file-tree'
    case 'location':
      return 'mdi-map-marker'
  }
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
}

function close() {
  modelValue.value = false
}

function selectSelectedItem(): void {
  const item = searchResults.value[selectedIndex.value]
  if (item) selectItem(item)
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
      scrollSelectedItemIntoView()
    }
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()

    if (selectedIndex.value > 0) {
      selectedIndex.value -= 1
      scrollSelectedItemIntoView()
    }
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectSelectedItem()
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function scrollSelectedItemIntoView(): void {
  void nextTick(() => {
    const selectedId = searchResults.value[selectedIndex.value]?.id
    if (!selectedId) return

    const selectedElement = Array.from(
      searchResultsContainer.value?.querySelectorAll<HTMLElement>(
        '[data-search-item-id]',
      ) ?? [],
    ).find((element) => element.dataset.searchItemId === selectedId)

    selectedElement?.scrollIntoView({ block: 'nearest' })
  })
}

watch(
  () => searchContext.search,
  () => {
    selectedIndex.value = 0
  },
)

watch(filteredItems, () => {
  if (searchResults.value.length === 0) {
    selectedIndex.value = 0
    return
  }

  selectedIndex.value = Math.min(
    selectedIndex.value,
    searchResults.value.length - 1,
  )
})

watch(modelValue, async (value) => {
  if (value) {
    await nextTick()
    searchInput.value?.focus()
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

.search-dialog__tree-card {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-dialog__tree-card .search-scroll-container {
  min-height: 0;
  flex: 1;
}

.search-dialog__scroll-container {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.search-dialog__item-title--selected {
  background-color: rgb(var(--v-theme-primary), 0.12);
}

.search-dialog__group-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
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

.search-dialog__route-path {
  display: block;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface), 0.6);
  font-size: 0.8em;
  font-style: italic;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
