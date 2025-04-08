import { SsdActionResult } from '@deltares/fews-ssd-requests'

export type DashboardActionParams = Pick<SsdActionResult, 'charts' | 'map'>
