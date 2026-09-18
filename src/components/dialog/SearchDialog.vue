<template>
  <v-dialog
    v-model="modelValue"
    max-width="640"
    class="search-dialog"
    @keydown="onKeydown"
  >
    <v-card rounded="lg">
      <v-text-field
        v-model="searchContext.search"
        autofocus
        hide-details
        prepend-inner-icon="mdi-magnify"
        placeholder="Search..."
        variant="plain"
        class="px-4 pt-2"
      />

      <v-divider />

      <v-list v-if="filteredItems.length" slim class="search-scroll-container py-0">
        <v-virtual-scroll :items="filteredItems" item-key="id" item-height="40">
          <template #default="{ item }">
            <v-treeview
              :items="[item]"
              item-title="label"
              item-value="id"
              density="compact"
              indent-lines="simple"
              class="py-0"
              :open-all="showAll(item, debouncedSearch)"
              :key="item.id"
            >
              <template #prepend="{ item: subItem }">
                <v-icon>{{ iconForItem(subItem) }}</v-icon>
              </template>
              <template #title="{ item: subItem }">
                <v-list-item-title
                  :class="{
                    'search-dialog__item-title--selected': isSelected(subItem),
                  }"
                  @click.stop="selectItem(subItem)"
                >
                  <HighlightMatch
                    :value="subItem.label"
                    :query="debouncedSearch"
                  />
                </v-list-item-title>
              </template>
            </v-treeview>
          </template>
        </v-virtual-scroll>
      </v-list>

      <div v-else class="pa-8 text-center text-medium-emphasis">
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

const selectedIndex = ref(0)
const debouncedSearch = refDebounced(
  computed(() => searchContext.search),
  100,
)

const filteredItems = computed(() => {
  const query = debouncedSearch.value.trim()
  if (!query) return searchContext.items

  return searchContext.items.filter((item) => isMatchingItem(item, query))
})

const searchResults = computed(() =>
  filteredItems.value.flatMap((item) => flattenItems(item)),
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
      item.children?.some((child) => isSelected(child) || hasSelectedChild(child)),
  )
}

function hasSelectedChild(item: SearchItem): boolean {
  return item.children?.some((child) => isSelected(child) || hasSelectedChild(child)) === true
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
    searchContext.search = ''
    selectedIndex.value = 0
  }
})
</script>

<style scoped>
.search-dialog:not(.v-dialog--fullscreen) {
  max-height: 60vh;
}

.search-dialog__item-title--selected {
  background-color: rgb(var(--v-theme-primary), 0.12);
}
</style>
