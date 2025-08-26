import { defineStore } from 'pinia'

export interface GlobalSearchItem {
  id: string
  title: string
  children?: GlobalSearchItem[]
}

interface GlobalSearchState {
  active: boolean
  type: 'locations' | 'parameters' | 'nodes'
  items: GlobalSearchItem[]
  selectedItems: string[]
}

const useGlobalSearchState = defineStore('globalSearchState', {
  state: (): GlobalSearchState => ({
    active: false,
    type: 'locations',
    items: [],
    selectedItems: [],
  }),
})

export { useGlobalSearchState }
