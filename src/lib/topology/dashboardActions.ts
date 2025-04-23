import { SsdActionResult } from '@deltares/fews-ssd-requests'

export type DashboardActionParams = Pick<SsdActionResult, 'charts' | 'map'>
export interface DashboardActionEventBus {
  trigger: number
  payload: {
    actionId?: string
  } & DashboardActionParams
}
