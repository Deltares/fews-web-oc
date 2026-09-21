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
          <span
            >Remove {{ LOCATION_SEARCH_SHORTCUT }} to search for anything</span
          >
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
        <div
          ref="searchResultsContainer"
          class="search-dialog__scroll-container"
        >
          <v-virtual-scroll
            ref="virtualScroll"
            :items="visibleRows"
            :item-height="48"
            class="search-dialog__virtual-scroll"
          >
            <template #default="{ item: row, index }">
              <!-- GROUP ROW -->
              <div
                v-if="row.kind === 'group'"
                class="search-dialog__row search-dialog__group-row"
                :data-search-row-index="index"
              >
                <div class="search-dialog__row-content">
                  <v-icon size="16">
                    {{
                      row.id === 'topology'
                        ? 'mdi-directions'
                        : 'mdi-map-marker'
                    }}
                  </v-icon>

                  <span class="search-dialog__group-title">
                    {{ row.label }}
                  </span>
                </div>
              </div>

              <!-- TREE ROW -->
              <div
                v-else
                class="search-dialog__row"
                :class="{
                  'search-dialog__row--selected': isSelected(row.item),
                }"
                :style="{ '--tree-depth': row.depth }"
                :data-search-item-id="row.item.id"
                :data-search-row-index="index"
                @click.stop="selectTreeItem(row.item)"
              >
                <div class="search-dialog__row-content">
                  <!-- indentation -->
                  <div class="search-dialog__indent" aria-hidden="true" />

                  <!-- expand/collapse -->
                  <button
                    v-if="row.item.children?.length"
                    type="button"
                    class="search-dialog__expand-button"
                    :aria-label="
                      isTreeItemExpanded(row.item) ? 'Collapse' : 'Expand'
                    "
                    @click.stop="toggleTreeItem(row.item)"
                  >
                    <v-icon size="18">
                      {{
                        isTreeItemExpanded(row.item)
                          ? 'mdi-chevron-down'
                          : 'mdi-chevron-right'
                      }}
                    </v-icon>
                  </button>

                  <span v-else class="search-dialog__expand-placeholder" />

                  <!-- icon -->
                  <div class="search-dialog__icon">
                    <v-icon v-if="row.item.type === 'topology'" size="16">
                      {{ row.item.iconName }}
                    </v-icon>

                    <v-img
                      v-else-if="
                        row.item.type === 'location' && row.item.iconName
                      "
                      :src="getResourcesIconsUrl(row.item.iconName)"
                      width="16"
                      height="16"
                      contain
                    />

                    <svg
                      v-else-if="row.item.type === 'location'"
                      class="search-dialog__location-marker"
                      viewBox="0 0 16 16"
                      width="10"
                      height="10"
                      aria-hidden="true"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        fill="#dfdfdf"
                        stroke="black"
                        stroke-width="2"
                      />
                    </svg>
                  </div>

                  <!-- title/details -->
                  <div class="search-dialog__content">
                    <div
                      class="search-dialog__title"
                      :class="{
                        'search-dialog__title--selected': isSelected(row.item),
                      }"
                    >
                      <HighlightMatch
                        :value="row.item.label"
                        :query="searchQuery"
                      />
                      <span
                        v-if="
                          row.item.type === 'location' &&
                          showLocationId(row.item)
                        "
                        class="search-dialog__id-match"
                      >
                        ID:
                        <HighlightMatch
                          :value="row.item.id"
                          :query="searchQuery"
                        />
                      </span>
                    </div>
                    <!-- route path -->
                    <div
                      v-if="
                        row.item.type === 'topology' &&
                        !row.item.children?.length
                      "
                      class="search-dialog__route-path"
                    >
                      <span v-if="isSelected(row.item)">
                        <kbd>Enter</kbd>
                        Open
                      </span>

                      {{ routeForItem(row.item).fullPath }}
                    </div>

                    <!-- selected item hint -->
                    <div
                      v-if="isSelected(row.item)"
                      class="search-dialog__item-hint"
                    >
                      <template v-if="row.item.type === 'location'">
                        <span v-if="row.item.children?.length">
                          <kbd>Space</kbd>
                          {{
                            isTreeItemExpanded(row.item) ? 'Collapse' : 'Expand'
                          }}
                        </span>

                        <span>
                          <kbd>Enter</kbd>
                          {{
                            isExclusivelySelected(row.item)
                              ? row.item.children?.length
                                ? 'Deselect subtree'
                                : 'Deselect location'
                              : row.item.children?.length
                                ? 'Select subtree'
                                : 'Select location'
                          }}
                        </span>

                        <span v-if="canUseAddLocationShortcut(row.item)">
                          <kbd>Shift</kbd>+<kbd>Enter</kbd>
                          {{
                            isLocationSelected(row.item)
                              ? 'Remove location'
                              : 'Add location'
                          }}
                        </span>
                      </template>

                      <template v-else-if="row.item.type === 'topology'">
                        <span v-if="row.item.children?.length">
                          <kbd>Space</kbd>
                          {{
                            isTreeItemExpanded(row.item) ? 'Collapse' : 'Expand'
                          }}
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </v-virtual-scroll>
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
          <kbd>←</kbd>
          <kbd>→</kbd>
          (De)collapse
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
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { useSearchContext } from '@/stores/searchContext'
import type { SearchItem } from '@/stores/searchContext'
import { containsSubstring } from '@/lib/search'
import HighlightMatch from '@/components/general/HighlightMatch.vue'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { VVirtualScroll } from 'vuetify/components'

const modelValue = defineModel<boolean>({
  type: Boolean,
  required: true,
})

const router = useRouter()
const route = useRoute()
const searchContext = useSearchContext()
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const virtualScroll = useTemplateRef<VVirtualScroll>('virtualScroll')

const LOCATION_SEARCH_SHORTCUT = '@' as const
const ROUTE_SEARCH_SHORTCUT = '#' as const

type SearchMode = 'location' | 'route'

const selectedIndex = ref(0)

const searchMode = computed<SearchMode | undefined>(() => {
  const firstCharacter = searchContext.search.charAt(0)
  if (firstCharacter === LOCATION_SEARCH_SHORTCUT) {
    return 'location'
  }
  if (firstCharacter === ROUTE_SEARCH_SHORTCUT) {
    return 'route'
  }
  return undefined
})

const searchPlaceholder = computed(() => {
  switch (searchMode.value) {
    case 'location':
      return 'Search locations...'
    case 'route':
      return 'Search routes...'
    default:
      return `Search... (${LOCATION_SEARCH_SHORTCUT} locations, ${ROUTE_SEARCH_SHORTCUT} routes)`
  }
})

const debouncedSearch = refDebounced(
  computed(() => searchContext.search),
  100,
)

const searchQuery = computed(() => {
  const value = debouncedSearch.value.trim()
  return searchMode.value ? value.slice(1).trim() : value
})

/**
 * We only need to search the top-level SearchItems.
 *
 * The original implementation did:
 *
 *   filter -> isMatchingItem -> recursive traversal
 *   then hasMatchingDescendant -> recursive traversal again
 *   then collectOpenedDescendants -> recursive traversal again
 *   then collectVisibleItems -> recursive traversal again
 *
 * This combines that work.
 */
interface MatchedRoot {
  item: SearchItem
  hasMatchingDescendant: boolean
}

const matchedRoots = computed<MatchedRoot[]>(() => {
  const query = searchQuery.value

  let roots
  if (searchMode.value === 'location') {
    roots = searchContext.items.filter((item) => item.type === 'location')
  } else if (searchMode.value === 'route') {
    roots = searchContext.items.filter((item) => item.type === 'topology')
  } else {
    roots = searchContext.items
  }

  if (!query) {
    return roots.map((item) => ({
      item,
      hasMatchingDescendant: false,
    }))
  }

  const result: MatchedRoot[] = []

  for (const item of roots) {
    const match = findMatch(item, query)

    if (match.matches) {
      result.push({
        item,
        hasMatchingDescendant: match.hasMatchingDescendant,
      })
    }
  }

  return result
})

interface MatchResult {
  matches: boolean
  hasMatchingDescendant: boolean
}

/**
 * Single recursive search.
 *
 * A node matches when:
 * - its label matches
 * - its location ID matches
 * - one of its descendants matches
 */
function findMatch(item: SearchItem, query: string): MatchResult {
  const ownMatch =
    containsSubstring(item.label, query) ||
    (item.type === 'location' && containsSubstring(item.id, query))

  let descendantMatch = false

  if (item.children?.length) {
    for (const child of item.children) {
      const result = findMatch(child, query)

      if (result.matches) {
        descendantMatch = true
        break
      }
    }
  }

  return {
    matches: ownMatch || descendantMatch,
    hasMatchingDescendant: descendantMatch,
  }
}

interface GroupRow {
  kind: 'group'
  id: 'topology' | 'location'
  label: string
}

interface TreeRow {
  kind: 'item'
  item: SearchItem
  depth: number
}

type VisibleRow = GroupRow | TreeRow

/**
 * The actual virtualized dataset.
 *
 * This is the most important optimization:
 *
 * v-virtual-scroll now receives individual rows rather than
 * two root treeviews.
 */
const visibleRows = computed<VisibleRow[]>(() => {
  const rows: VisibleRow[] = []
  const query = searchQuery.value
  const topologyRoots = matchedRoots.value.filter(
    ({ item }) => item.type === 'topology',
  )
  const locationRoots = matchedRoots.value.filter(
    ({ item }) => item.type === 'location',
  )
  appendGroup(rows, 'topology', 'Routes', topologyRoots, query)
  appendGroup(rows, 'location', 'Locations', locationRoots, query)
  return rows
})

function appendGroup(
  rows: VisibleRow[],
  id: 'topology' | 'location',
  label: string,
  roots: MatchedRoot[],
  query: string,
): void {
  if (!roots.length) return

  rows.push({
    kind: 'group',
    id,
    label,
  })

  for (const root of roots) {
    appendVisibleItem(rows, root.item, 0, query)
  }
}

function appendVisibleItem(
  rows: VisibleRow[],
  item: SearchItem,
  depth: number,
  query: string,
): void {
  rows.push({
    kind: 'item',
    item,
    depth,
  })

  if (!item.children?.length) {
    return
  }
  if (!openedTreeIds.value.has(item.id)) {
    return
  }
  for (const child of item.children) {
    appendVisibleItem(rows, child, depth + 1, query)
  }
}

/**
 * Logical search results used for keyboard navigation.
 *
 * Groups are deliberately excluded.
 */
const searchResults = computed<SearchItem[]>(() =>
  visibleRows.value
    .filter((row): row is TreeRow => row.kind === 'item')
    .map((row) => row.item),
)

const openedTreeIds = ref<Set<string>>(new Set())

function getDefaultOpenedIds(): Set<string> {
  const result = new Set<string>()

  const query = searchQuery.value

  for (const { item } of matchedRoots.value) {
    result.add(item.id)

    if (!query) continue

    openMatchingAncestors(item, query, result)
  }

  return result
}

/**
 * Opens only ancestors of matching nodes.
 *
 * Unlike the previous implementation, this doesn't first
 * calculate `hasMatchingDescendant()` and then traverse
 * everything again.
 */
function openMatchingAncestors(
  item: SearchItem,
  query: string,
  result: Set<string>,
): boolean {
  if (!item.children?.length) {
    return false
  }

  let hasMatch = false

  for (const child of item.children) {
    const ownMatch =
      containsSubstring(child.label, query) ||
      (child.type === 'location' && containsSubstring(child.id, query))

    const descendantMatch = openMatchingAncestors(child, query, result)

    if (ownMatch || descendantMatch) {
      hasMatch = true
      result.add(item.id)
    }
  }

  return hasMatch
}

function isSelected(item: SearchItem): boolean {
  return searchResults.value[selectedIndex.value]?.id === item.id
}

function isTreeItemExpanded(item: SearchItem): boolean {
  return openedTreeIds.value.has(item.id)
}

function toggleTreeItem(item: SearchItem): void {
  const next = new Set(openedTreeIds.value)

  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }

  openedTreeIds.value = next
}

function selectTreeItem(item: SearchItem): void {
  selectItem(item)
}

function showLocationId(item: SearchItem): boolean {
  const query = searchQuery.value

  if (!query || item.type !== 'location') {
    return false
  }

  return (
    containsSubstring(item.id, query) && !containsSubstring(item.label, query)
  )
}

function isLocationSelected(item: SearchItem): boolean {
  if (item.type !== 'location') {
    return false
  }

  return getCurrentLocationIdSet().has(String(item.params.locationId))
}

function getCurrentLocationIds(): string[] {
  const currentLocationIds = route.params.locationIds

  if (Array.isArray(currentLocationIds)) {
    return currentLocationIds
  }

  return currentLocationIds?.split(',') ?? []
}

function getCurrentLocationIdSet(): Set<string> {
  return new Set(getCurrentLocationIds())
}

function collectLocationIds(item: SearchItem): string[] {
  const result: string[] = []

  const stack: SearchItem[] = [item]

  while (stack.length) {
    const current = stack.pop()!

    if (current.type === 'location') {
      result.push(String(current.params.locationId))
    }

    if (current.children?.length) {
      for (let i = current.children.length - 1; i >= 0; i--) {
        stack.push(current.children[i])
      }
    }
  }

  return result
}

function isExclusivelySelected(item: SearchItem): boolean {
  const locationIds = collectLocationIds(item)
  const currentLocationIds = getCurrentLocationIds()

  if (currentLocationIds.length !== locationIds.length) {
    return false
  }

  const current = new Set(currentLocationIds)

  return locationIds.every((id) => current.has(id))
}

function canUseAddLocationShortcut(item: SearchItem): boolean {
  const currentLocationIds = getCurrentLocationIds()

  return (
    currentLocationIds.length > 0 &&
    (!isLocationSelected(item) || currentLocationIds.length > 1)
  )
}
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
    route.params.topologyId !== undefined
      ? router.resolve({
          name: 'TopologySpatialDisplayWithLocation',
          params: {
            topologyId: route.params.topologyId,
            nodeId: route.params.nodeId,
            layerName: route.params.layerName,
            locationIds: params.locationId,
          },
          query: route.query,
        })
      : router.resolve({
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

function routeForItem(item: SearchItem, addLocation = false) {
  if (item.type === 'location') {
    return routeForLocation(item, addLocation)
  }

  return routeFactories[item.type](item.params)
}

function routeForLocation(item: SearchItem, addLocation: boolean) {
  const locationId = String(item.params.locationId)
  const currentLocationIds = getCurrentLocationIds()

  if (route.params.topologyId !== undefined) {
    const locationIds =
      addLocation || !currentLocationIds.includes(locationId)
        ? [...new Set([...currentLocationIds, locationId])]
        : currentLocationIds.filter((id) => id !== locationId)

    return router.resolve({
      name:
        locationIds.length > 0
          ? 'TopologySpatialDisplayWithLocation'
          : 'TopologySpatialDisplay',
      params: {
        topologyId: route.params.topologyId,
        nodeId: route.params.nodeId,
        layerName: route.params.layerName,
        ...(locationIds.length > 0
          ? {
              locationIds: locationIds.join(','),
            }
          : {}),
      },
      query: route.query,
    })
  }

  if (route.params.locationId === locationId && !addLocation) {
    return router.resolve({
      name: 'SpatialDisplay',
      params: {
        layerName: route.params.layerName,
      },
      query: route.query,
    })
  }

  return routeFactories.location(item.params)
}

function routeForLocationIds(locationIds: string[]) {
  if (route.params.topologyId !== undefined) {
    return router.resolve({
      name:
        locationIds.length > 0
          ? 'TopologySpatialDisplayWithLocation'
          : 'TopologySpatialDisplay',
      params: {
        topologyId: route.params.topologyId,
        nodeId: route.params.nodeId,
        layerName: route.params.layerName,
        ...(locationIds.length > 0
          ? {
              locationIds: locationIds.join(','),
            }
          : {}),
      },
      query: route.query,
    })
  }

  return locationIds.length > 0
    ? router.resolve({
        name: 'SpatialDisplayWithLocation',
        params: {
          locationId: locationIds[0],
        },
      })
    : router.resolve({
        name: 'SpatialDisplay',
        params: {
          layerName: route.params.layerName,
        },
        query: route.query,
      })
}

function selectItem(item: SearchItem, addLocation = false) {
  router.push(routeForItem(item, addLocation))
}

function selectSelectedItem(event?: KeyboardEvent): void {
  const item = searchResults.value[selectedIndex.value]
  if (!item) return

  if (item.type === 'location') {
    selectSelectedLocation(event)
    return
  }
  if (!item.children?.length) {
    selectItem(item)
  }
}

function selectSelectedLocation(event?: KeyboardEvent): void {
  const item = searchResults.value[selectedIndex.value]
  if (!item || item.type !== 'location') {
    return
  }

  const locationIds = collectLocationIds(item)
  const currentLocationIds = getCurrentLocationIds()
  const current = new Set(currentLocationIds)
  const addLocation = event?.shiftKey === true

  let nextLocationIds: string[]

  const allSelected = locationIds.every((id) => current.has(id))

  if (!addLocation) {
    nextLocationIds = allSelected ? [] : locationIds
  } else if (allSelected) {
    const selected = new Set(locationIds)
    nextLocationIds = currentLocationIds.filter((id) => !selected.has(id))
  } else {
    nextLocationIds = [...new Set([...currentLocationIds, ...locationIds])]
  }

  router.push(routeForLocationIds(nextLocationIds))
}

function expandSelectedItem(): void {
  const item = searchResults.value[selectedIndex.value]

  if (!item?.children?.length) {
    return
  }
  toggleTreeItem(item)
}

function close(): void {
  modelValue.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (!modelValue.value) return

  const items = searchResults.value

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()

      if (items.length) {
        selectedIndex.value = (selectedIndex.value + 1) % items.length

        scrollSelectedItemIntoView()
      }

      break

    case 'ArrowUp':
      event.preventDefault()

      if (selectedIndex.value > 0) {
        selectedIndex.value--
        scrollSelectedItemIntoView()
      }

      break

    case 'ArrowLeft':
    case 'ArrowRight':
      event.preventDefault()

      toggleSelectedTreeItem(event.key, items)

      break
    case 'Spacebar':
      event.preventDefault()
      expandSelectedItem()
      break

    case 'Enter':
      event.preventDefault()
      selectSelectedItem(event)
      break

    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}

function toggleSelectedTreeItem(key: string, items: SearchItem[]): void {
  const item = items[selectedIndex.value]

  if (!item?.children?.length) return

  const expanded = openedTreeIds.value.has(item.id)

  if (key === 'ArrowRight' && !expanded) {
    toggleTreeItem(item)
    return
  }

  if (key === 'ArrowLeft' && expanded) {
    toggleTreeItem(item)
  }
}

function scrollSelectedItemIntoView(): void {
  void nextTick(() => {
    /**
     * Vuetify's virtual scroll exposes `scrollToIndex`
     * in current versions. Keeping this isolated makes it
     * easy to adapt if the project's Vuetify version uses
     * a slightly different API.
     */
    virtualScroll.value?.scrollToIndex?.(selectedIndex.value)
  })
}

watch(
  searchQuery,
  () => {
    selectedIndex.value = 0
    openedTreeIds.value = getDefaultOpenedIds()
  },
  { immediate: true },
)

watch(
  () => searchResults.value.length,
  (length) => {
    if (!length) {
      selectedIndex.value = 0
      return
    }

    selectedIndex.value = Math.min(selectedIndex.value, length - 1)
  },
)

watch(modelValue, async (value) => {
  if (!value) return

  await nextTick()
  searchInput.value?.focus()
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

.search-dialog__results {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-dialog__scroll-container {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.search-dialog__virtual-scroll {
  height: 100%;
}

.search-dialog__row {
  box-sizing: border-box;
  min-height: 48px;
  width: 100%;
  padding-left: 8px;
  padding-right: 8px;
  cursor: pointer;
}

.search-dialog__row--selected {
  background-color: rgb(var(--v-theme-primary), 0.12);
}

.search-dialog__row-content {
  display: flex;
  align-items: center;
  min-height: 48px;
  width: 100%;
}

.search-dialog__group-row {
  cursor: default;
}

.search-dialog__group-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.search-dialog__indent {
  flex: 0 0 calc(var(--tree-depth, 0) * 20px);
}

.search-dialog__expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.search-dialog__expand-placeholder {
  flex: 0 0 24px;
  width: 24px;
}

.search-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  width: 24px;
  margin-right: 4px;
}

.search-dialog__content {
  min-width: 0;
  flex: 1;
}

.search-dialog__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-dialog__title--selected {
  font-weight: 500;
}

.search-dialog__id-match {
  margin-left: 8px;
  color: rgb(var(--v-theme-on-surface), 0.6);
  font-size: 0.8em;
  font-style: italic;
}

.search-dialog__route-path {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface), 0.6);
  font-size: 0.8em;
  font-style: italic;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-dialog__item-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface), 0.6);
  font-size: 0.8em;
}

.search-dialog__item-hint span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.search-dialog__location-marker {
  flex-shrink: 0;
}
</style>
