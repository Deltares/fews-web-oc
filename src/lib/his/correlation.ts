import type { SeriesData } from '@/lib/timeseries/types/SeriesData'

export function calculateCorrelationTimeSeries(
  series1: SeriesData[],
  series2: SeriesData[],
) {
  const points = series1.map((point, index) => ({
    x: series2[index]?.y ?? null,
    y: point.y,
    flag: point.flag,
    flagSource: point.flagSource,
    comment: point.comment,
    user: point.user,
  }))

  const n = points.length
  const sumX = points.reduce((sum, p) => sum + (p.x ?? 0), 0)
  const sumY = points.reduce((sum, p) => sum + (p.y ?? 0), 0)
  const sumXY = points.reduce((sum, p) => sum + (p.x ?? 0) * (p.y ?? 0), 0)
  const sumX2 = points.reduce((sum, p) => sum + (p.x ?? 0) ** 2, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2)
  const intercept = (sumY - slope * sumX) / n

  const line = points.map((point) => ({
    x: point.x,
    y: point.x !== null ? slope * point.x + intercept : null,
    flag: point.flag,
    flagSource: null,
    comment: point.comment,
    user: point.user,
  }))

  return { points, line, slope, intercept }
}
