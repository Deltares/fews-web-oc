import { defineStore } from 'pinia'

export interface GlobalSearchItem {
  id: string
  name: string
}

interface GlobalSearchState {
  active: boolean
  type: 'locations' | 'parameters' | 'nodes'
  items: GlobalSearchItem[]
  selectedItem: GlobalSearchItem | null
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
