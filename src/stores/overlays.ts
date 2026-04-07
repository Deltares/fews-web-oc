import { Overlay } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'

export interface OverlaysState {
  overlays: (Overlay & { visible?: boolean; opacity?: number })[]
}

export const useOverlaysStore = defineStore('overlays', {
  state: (): OverlaysState => ({
    overlays: [],
  }),

  getters: {
    listOverlays: (state) => {
      return state.overlays
    },
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
      const defauts = {
        opacity: 1,
      }
      if (index === -1) {
        this.overlays.push({ ...defauts, ...overlay })
      } else {
        const current = this.overlays[index]
        console.log('Updating overlay', { ...defauts, ...overlay, ...current })
        this.overlays[index] = { ...defauts, ...overlay, ...current }
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
