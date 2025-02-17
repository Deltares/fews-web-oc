import { defineStore } from 'pinia'

interface GlobalSearchState {
  active: boolean
  type: 'locations' | 'parameters' | 'nodes'
  items: GlobalSearchItem[]
  selectedItem: GlobalSearchItem | null
}

interface GlobalSearchItem {
  id: string
  name: string
}

const useGlobalSearchState = defineStore('globalSearchState', {
  state: (): GlobalSearchState => ({
    active: false,
    type: 'locations',
    items: [],
    selectedItem: null,
  }),
})

export { useGlobalSearchState }
