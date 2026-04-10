import { Overlay as FewsPiOverlay } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'

export interface Overlay extends FewsPiOverlay {
  visible?: boolean
  opacity?: number
}

export interface OverlaysState {
  overlays: (Overlay & { visible?: boolean; opacity?: number })[]
}

export const useOverlaysStore = defineStore('overlays', {
  state: (): OverlaysState => ({
    overlays: [],
  }),

  getters: {
    getOverlay: (state) => (id: string) => {
      return state.overlays.find((overlay) => overlay.id === id)
    },
    visibleOverlays: (state) => {
      return state.overlays.filter((overlay) => overlay.visible)
    },
  },

  actions: {
    addOverlay(overlay: Overlay) {
      const index = this.overlays.findIndex((o) => o.id === overlay.id)
      const defaults = {
        opacity: 1,
      }
      if (index === -1) {
        this.overlays.push({ ...defaults, ...overlay })
      } else {
        const current = this.overlays[index]
        this.overlays[index] = { ...defaults, ...overlay, ...current }
      }
    },
    removeOverlay(id: string) {
      this.overlays = this.overlays.filter((overlay) => overlay.id !== id)
    },
  },

  persist: [
    {
      key: 'weboc-overlays-v1.0.0',
      storage: window.localStorage,
      pick: ['overlays'],
    },
  ],
})
