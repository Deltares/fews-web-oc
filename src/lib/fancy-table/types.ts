import {
  ActionsResponse as BaseActionsResponse,
  ActionResult as BaseActionResult,
  ActionRequestConfig as BaseActionRequestConfig,
} from '@deltares/fews-pi-requests'
import { ColourMap } from '@deltares/fews-wms-requests'

export enum RowType {
  Value = 'value',
  ColoredValue = 'colored-value',
  Direction = 'direction',
  Graph = 'graph',
}

export enum DirectionType {
  Wave = 'wave',
  Wind = 'wind',
  Current = 'current',
}

interface RowConfigBase {
  label: string
  request: string
  relativeHeight?: number
}

export interface ValueRowConfig extends RowConfigBase {
  type: RowType.Value
}

export interface ColoredValueRowConfig extends RowConfigBase {
  type: RowType.ColoredValue
  colorMap: ColourMap
  fontColor?: string
}

export interface DirectionRowConfig extends RowConfigBase {
  type: RowType.Direction
  directionType: DirectionType
}

export interface GraphRowConfig extends RowConfigBase {
  type: RowType.Graph
  showValues?: boolean
  alignValues?: 'middle' | 'bottom'
  fill?: string
  stroke?: string
}

export type RowConfig =
  | ValueRowConfig
  | ColoredValueRowConfig
  | DirectionRowConfig
  | GraphRowConfig

export interface TableConfig {
  rows: RowConfig[]
}

export interface ActionsResponse extends BaseActionsResponse {
  results: ActionResult[]
}

export interface ActionResult extends BaseActionResult {
  config?: ActionRequestConfig
}

export interface ActionRequestConfig extends BaseActionRequestConfig {
  preferredDisplay: 'table' | 'charts'
  tableDisplay?: TableConfig
}
