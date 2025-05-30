import { RouteLocationRaw } from 'vue-router'

export interface ColumnItem {
  id: string
  name: string
  children?: ColumnItem[]
  to?: RouteLocationRaw
  href?: string
  target?: string
  icon?: string
  appendIcon?: string
  thresholdIcon?: string
  thresholdCount?: number
}
