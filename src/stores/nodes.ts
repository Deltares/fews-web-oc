import type { ColumnItem } from '@/components/general/ColumnItem'
import { defineStore } from 'pinia'

interface NodesState {
  activeNodeId: string
  nodeButtons: ColumnItem[]
}

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    activeNodeId: '',
    nodeButtons: [],
  }),
  getters: {
    getRouteTarget: (state) => {
      return (sources: ColumnItem[]) => {
        if (state.activeNodeId) {
          const sourceIndex = sources.findIndex((source) => {
            return source.id === state.activeNodeId
          })
          if (sourceIndex > -1) {
            state.activeNodeId = sources[sourceIndex].id
            return sources[sourceIndex].to
          }
        }
        return sources[0].to
      }
    },
  },
  actions: {
    setNodeButtons(nodeButtons: ColumnItem[]) {
      this.nodeButtons = nodeButtons
      if (!this.activeNodeId && this.nodeButtons.length > 0) {
        this.activeNodeId = this.nodeButtons[0].id
      }
    },
  },
})
