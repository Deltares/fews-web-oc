import type { LngLatBounds } from 'maplibre-gl'
import type { Layer } from '@deltares/fews-wms-requests'

type StreamlineLayerOptionsFews = Layer['animatedVectors']

export type LayerOptions = {
  name: string
  time?: Date
  useDisplayUnits?: boolean
  bbox?: LngLatBounds
  elevation?: number | null
  colorScaleRange?: string
  style?: string
  useLastValue?: boolean
  layerType?: string
} & StreamlineLayerOptionsFews
