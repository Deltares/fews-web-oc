import { TimeStep } from '@deltares/fews-pi-requests'

export interface SeriesHeader {
  name?: string
  location?: string
  parameter?: string
  source?: string
  unit?: string
  timeStep?: TimeStep
  version?: string
  timeZone?: string
}
