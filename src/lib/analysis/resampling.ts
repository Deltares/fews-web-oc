import type { TimeSeriesFilter } from '@deltares/fews-pi-requests'
import { arrayOfAll } from '@/lib/utils/types'

export type ResamplingMethod = {
  label: string
  // FIXME: Percentile currently does not work in the backend
  value: Exclude<Required<TimeSeriesFilter>['resamplingMethod'], 'percentile'>
}

const arrayOfAllResamplingMethods = arrayOfAll<ResamplingMethod>()
export const resamplingMethods = arrayOfAllResamplingMethods([
  { label: 'Minimum', value: 'minimum' },
  { label: 'Maximum', value: 'maximum' },
  { label: 'Mean', value: 'mean' },
  { label: 'Mean (time weighted)', value: 'mean_over_time' },
  { label: 'Sum', value: 'sum' },
  { label: 'Instantaneous', value: 'instantaneous' },
])
