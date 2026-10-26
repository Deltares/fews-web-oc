export type ChartMarkerShape =
  | 'circle'
  | 'cross'
  | 'diamond'
  | 'square'
  | 'asterisk'
  | 'triangle-up'
  | 'triangle-down'
  | 'wye'
  | 'x'
  | 'plus'
  | 'rectangle'

export interface ChartMarker {
  shape: ChartMarkerShape
  size: number
  skip: number
}
