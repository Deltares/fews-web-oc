import type { ColumnItem } from '@/components/general/ColumnItem'
import { defineStore } from 'pinia'

interface NodesState {
  activeParentId: string
  activeParentNode: number
  nodeButtons: ColumnItem[]
}

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    activeParentId: '',
    activeParentNode: 0,
    nodeButtons: [],
  }),
  actions: {
    setNodeButtons(nodeButtons: ColumnItem[]) {
      this.nodeButtons = nodeButtons
      if (!this.activeParentId && this.nodeButtons.length > 0) {
        this.activeParentId = this.nodeButtons[0].id
      }
    },
    getRouteTarget(sources: ColumnItem[]) {
      if (this.activeParentId) {
        const sourceIndex = sources.findIndex((source) => {
          return source.name === this.activeParentId
        })
        if (sourceIndex > -1) {
          this.activeParentNode = sourceIndex
          this.activeParentId = sources[sourceIndex].name
          return sources[sourceIndex].to
        }
      }
      this.activeParentNode = 0
      this.activeParentId = sources[0].name
      return sources[0].to
    },
  },
})
