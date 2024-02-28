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
  colourMap: ColourMap
  initialRange?: Range
  range: Range
}

interface ColourScalesState {
  colourScales: ColourScale[]
}

const useColourScalesStore = defineStore('colourScales', {
  state: (): ColourScalesState => ({
    colourScales: [],
  }),
  getters: {
    getCurrentColourScale: (state) => state.colourScales[0],
  },
})

export { useColourScalesStore }
