import { defineStore } from 'pinia'
import { Style } from '@deltares/fews-wms-requests'
import { ColourMap } from '@deltares/fews-web-oc-charts'

export interface Range {
  min: number
  max: number
}

export interface ColourScale {
  title: string
  style: Style
  range: Range
  initialRange: Range
  colourMap: ColourMap
}

interface ColourScalesState {
  scales: Record<string, ColourScale>
  currentIds: string[]
  currentIndex: number
}

const useColourScalesStore = defineStore('colourScales', {
  state: (): ColourScalesState => ({
    scales: {},
    currentIds: [],
    currentIndex: 0,
  }),
  getters: {
    currentScaleId: (state) => state.currentIds[state.currentIndex],
    currentScale(): ColourScale | undefined {
      if (!this.currentScaleId) return
      return this.scales[this.currentScaleId]
    },
    currentScales(): ColourScale[] {
      return this.currentIds.map((id) => this.scales[id])
    },
    currentScaleIsInitialRange(): boolean {
      if (!this.currentScale) return false
      return (
        this.currentScale.range.min === this.currentScale.initialRange.min &&
        this.currentScale.range.max === this.currentScale.initialRange.max
      )
    },
  },
  actions: {
    setCurrentScaleRange(newRange: Range) {
      if (!this.currentScale) return
      this.currentScale.range = newRange
    },
    resetCurrentScaleRange() {
      if (!this.currentScale) return
      this.currentScale.range = this.currentScale.initialRange
    },
  },
})

export { useColourScalesStore }
