<template>
  <v-dialog
    v-model="active"
    transition="dialog-top-transition"
    :fullscreen="mobile"
    scrollable
    :max-width="mobile ? undefined : '900'"
    class="align-start"
    @keydown.esc="active = false"
  >
    <v-card>
      <v-toolbar density="compact">
        <v-text-field
          v-model="search"
          :placeholder="t('search.searchForLocations')"
          variant="outlined"
          hide-details
          clearable
          density="compact"
          autofocus
          prepend-icon="mdi-map-marker"
          class="ps-3"
        />
        <v-btn icon="mdi-close" @click="active = false" />
      </v-toolbar>
      <div class="d-flex px-1 pt-3 pb-2 align-center">
        <span class="pe-1">Filter</span>
        <v-btn-toggle density="compact" v-model="showOnlySelected">
          <v-btn variant="tonal" :value="false">{{ t('all') }}</v-btn>
          <v-btn
            prepend-icon="mdi-checkbox-marked"
            variant="tonal"
            :value="true"
            >{{ t('selected') }}
          </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn
          prepend-icon="mdi-close-circle"
          variant="tonal"
          rounded
          @click.stop="selectedItems = []"
          >{{ t('clear_all') }}</v-btn
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
                (selection) =>
                  updateSelectedChildren(item, selection as string[])
              "
              :key="item.id"
              :open-all="showAll(item, debouncedSearch)"
            >
              <template #title="{ item: subItem }">
                <HighlightMatch
                  :value="subItem.title"
                  :query="debouncedSearch"
                />
                <span class="id-match" v-if="showId(subItem)">
                  ID:
                  <HighlightMatch
                    :value="subItem.id"
                    :query="debouncedSearch"
                  />
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

import HighlightMatch from './HighlightMatch.vue'
import { cascadeStrategy } from '@/lib/selection'
import { debouncedRef } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

interface SearchItem {
  id: string
  title: string
  children?: SearchItem[]
}

interface SearchItemWithTreeIds extends SearchItem {
  treeIds: string[]
}

interface Props {
  items: SearchItem[]
}

const props = defineProps<Props>()

const active = defineModel<boolean>({ required: true })
const selectedItems = defineModel<string[]>('selectedItems', { required: true })

const { t } = useI18n()
const { mobile } = useDisplay()
const search = ref<string | undefined>()
const debouncedSearch = debouncedRef(search, 100)
const showOnlySelected = ref(false)

const itemWithTreeIds = computed(() => {
  // Return all items from the store, add property with all children ids for easier filtering
  return props.items.map((item) => {
    const childIds = item.children?.flatMap((child) => child.id) ?? []
    return {
      ...item,
      treeIds: [item.id, ...childIds],
    }
  })
})

const filteredNodes = computed(() => {
  const items = showOnlySelected.value
    ? itemWithTreeIds.value.filter((item) => {
        return item.treeIds.some((id) => selectedItems.value.includes(id))
      })
    : itemWithTreeIds.value

  const searchString = debouncedSearch.value?.trim()
  if (!searchString) {
    return items
  }

  return items.filter((node) => isMatchingItem(node, searchString))
})

function showId(item: SearchItemWithTreeIds): boolean {
  const query = search.value
  if (!query) return false

  const isMatchingName = containsSubstring(item.title, query)
  const isMatchingId = containsSubstring(item.id, query)
  // Only show the ID if the search query matches the ID but not the name.
  return isMatchingId && !isMatchingName
}

function selectedChildren(item: SearchItemWithTreeIds) {
  return selectedItems.value.filter((id) => item.treeIds.includes(id))
}

function updateSelectedChildren(
  item: SearchItemWithTreeIds,
  selection: string[],
) {
  // Remove any previously selected child IDs of this item.
  const filtered = selectedItems.value.filter(
    (id) => !item.treeIds.includes(id),
  )
  // Add the newly selected child IDs.
  selectedItems.value = filtered.concat(selection)
}

function isMatchingItem(item: SearchItem, query: string): boolean {
  if (
    containsSubstring(item.id, query) ||
    containsSubstring(item.title, query)
  ) {
    return true
  }
  if (item.children?.some((child) => isMatchingItem(child, query))) {
    return true
  }
  return false
}

function showAll(
  item: SearchItemWithTreeIds,
  query: string | undefined,
): boolean {
  if (!query) {
    return false
  }
  if (item.children?.some((child) => isMatchingItem(child, query))) {
    return true
  }
  return false
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
