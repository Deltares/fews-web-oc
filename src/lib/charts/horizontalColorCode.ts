import { SeriesArrayData, SeriesData } from '../timeseries/types/SeriesData'
import type { ChartSeries } from './types/ChartSeries'

export function getColorMap(classBreaks: ChartSeries['classBreaks']) {
  return (value: number): string => {
    const breakpoint = classBreaks?.findLast(
      (breakpoint) => value >= breakpoint.lowerValue,
    )
    return breakpoint?.color ?? 'black'
  }
}

export function horizontalColorCodeDataFromData(
  series: ChartSeries,
  data: (SeriesData | SeriesArrayData)[],
) {
  return data.map(({ x, y }) => ({
    x,
    y: series.name,
    color: y,
  }))
}
