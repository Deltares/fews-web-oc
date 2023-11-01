import type { TimeSeriesEvent } from '@deltares/fews-pi-requests'

export interface SeriesData
  extends Pick<TimeSeriesEvent, 'flag' | 'flagSource' | 'comment' | 'user'> {
  x: Date
  y: number | null
}
