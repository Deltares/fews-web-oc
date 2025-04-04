import { SsdActionResult } from '@deltares/fews-ssd-requests'

// FIXME:: add to the schema
export interface DashboardSsdActionResult extends SsdActionResult {
  charts?: {
    displayId?: string
    chartsLocationId?: string
  }
  map?: {
    locationId?: string
  }
}

export type DashboardActionParams = Pick<
  DashboardSsdActionResult,
  'charts' | 'map'
>
