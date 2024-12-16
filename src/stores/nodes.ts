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
          const currentIndex = state.nodeButtons.findIndex((node) => {
            return node.id === state.activeNodeId
          })
          const currentNodeName = state.nodeButtons[currentIndex]?.name
          const sourceIndex = sources.findIndex((source) => {
            return source.name === currentNodeName
          })
          if (sourceIndex > -1) {
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
    },
  },
})
