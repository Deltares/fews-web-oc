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

  const n = points.filter((p) => p.x !== null && p.y !== null).length
  const validPoints = points.filter((p) => p.x !== null && p.y !== null)

  const sumX = validPoints.reduce((sum, p) => sum + (p.x as number), 0)
  const sumY = validPoints.reduce((sum, p) => sum + (p.y as number), 0)
  const sumXY = validPoints.reduce(
    (sum, p) => sum + (p.x as number) * (p.y as number),
    0,
  )
  const sumX2 = validPoints.reduce((sum, p) => sum + (p.x as number) ** 2, 0)
  const sumY2 = validPoints.reduce((sum, p) => sum + (p.y as number) ** 2, 0)

  const denominator = Math.sqrt(
    (n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2),
  )
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  const intercept = denominator !== 0 ? (sumY - slope * sumX) / n : 0

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
