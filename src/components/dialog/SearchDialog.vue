<template>
  <v-dialog v-model="modelValue" max-width="640" @keydown="onKeydown">
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

      <v-list
        v-if="searchContext.filteredItems.length"
        density="comfortable"
        class="py-2"
      >
        <v-list-item
          v-for="(item, index) in searchContext.filteredItems"
          :key="item.id"
          :active="index === selectedIndex"
          @click="selectItem(item)"
          @mouseenter="selectedIndex = index"
        >
          <template #prepend>
            <v-icon>
              {{
                item.type === 'user'
                  ? 'mdi-account'
                  : item.type === 'project'
                    ? 'mdi-folder'
                    : 'mdi-file-document'
              }}
            </v-icon>
          </template>

          <v-list-item-title>
            {{ item.label }}
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ item.type }}
          </v-list-item-subtitle>

          <template #append>
            <v-icon size="small"> mdi-arrow-top-right </v-icon>
          </template>
        </v-list-item>
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchContext } from '@/stores/searchContext'
import type { SearchItem } from '@/stores/searchContext'

const modelValue = defineModel({
  type: Boolean,
  required: true,
})

const router = useRouter()
const searchContext = useSearchContext()

const selectedIndex = ref(0)

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

  const items = searchContext.filteredItems

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

watch(modelValue, (value) => {
  if (!value) {
    searchContext.search = ''
    selectedIndex.value = 0
  }
})
</script>
