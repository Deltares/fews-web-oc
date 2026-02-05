import type { TimeSeriesEvent } from '@deltares/fews-pi-requests'

export interface SeriesData extends Pick<
  TimeSeriesEvent,
  'flag' | 'flagSource' | 'comment' | 'user'
> {
  x: Date | number | null
  y: number | null
}

export interface SeriesArrayData extends Pick<
  TimeSeriesEvent,
  'flag' | 'flagSource' | 'comment' | 'user'
> {
  x: Date | number | null
  y: (number | null)[]
}

export interface TimeSeriesData extends SeriesData {
  x: Date
}

export function isSeriesArrayData(
  data: SeriesData | SeriesArrayData,
): data is SeriesArrayData {
  return Array.isArray(data.y)
}
