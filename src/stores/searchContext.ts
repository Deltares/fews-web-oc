import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type SearchItemType = 'user' | 'project' | 'document'

export interface SearchItem {
  id: string
  label: string
  params: Record<string, string | number>
  type: SearchItemType
}

export const useSearchContext = defineStore('searchContext', () => {
  // The dialog passes the user's input here.
  const search = ref('')

  const items = ref<SearchItem[]>([
    {
      id: 'user-1',
      label: 'John Doe',
      type: 'user',
      params: {
        id: '123',
      },
    },
    {
      id: 'project-1',
      label: 'Website Redesign',
      type: 'project',
      params: {
        id: '456',
      },
    },
    {
      id: 'document-1',
      label: 'Product Requirements',
      type: 'document',
      params: {
        id: '789',
      },
    },
    {
      id: 'project-2',
      label: 'Mobile App',
      type: 'project',
      params: {
        id: '999',
      },
    },
  ])

  const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
      return items.value
    }

    return items.value.filter((item) =>
      item.label.toLowerCase().includes(query),
    )
  })

  return {
    search,
    items,
    filteredItems,
  }
})
