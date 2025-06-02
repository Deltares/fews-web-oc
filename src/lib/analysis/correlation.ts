import type { SeriesData } from '@/lib/timeseries/types/SeriesData'

export function calculateCorrelationAndRegression(
  series1: SeriesData[],
  series2: SeriesData[],
) {
  if (series1.length !== series2.length) {
    console.error(
      `Series lengths do not match: ${series1.length} vs ${series2.length}`,
    )
    return {
      points: [],
      correlation: NaN,
      regression: {
        line: [],
        slope: NaN,
        intercept: NaN,
      },
    }
  }

  const points = series1.map((point, index) => ({
    x: series2[index]?.y ?? null,
    y: point.y,
    flag: '0' as SeriesData['flag'],
  }))

  const validPoints = points.filter((p) => p.x !== null && p.y !== null)

  const n = validPoints.length

  if (n === 0) {
    throw new Error('No valid points to calculate correlation and regression.')
  }

  const meanX = validPoints.reduce((sum, p) => sum + p.x!, 0) / n
  const meanY = validPoints.reduce((sum, p) => sum + p.y!, 0) / n

  let covariance = 0
  let varianceX = 0
  let varianceY = 0

  for (const p of validPoints) {
    const diffX = p.x! - meanX
    const diffY = p.y! - meanY

    covariance += diffX * diffY
    varianceX += diffX * diffX
    varianceY += diffY * diffY
  }

  // Calculates the pearson correlation coefficient
  const correlation = covariance / Math.sqrt(varianceX * varianceY)

  // Calculates the slope and intercept of the regression line
  const slope = covariance / varianceX
  const intercept = meanY - slope * meanX

  const line: SeriesData[] = points.map((point) => ({
    x: point.x,
    y: point.x !== null ? slope * point.x + intercept : null,
    flag: '0',
  }))

  return {
    points,
    correlation,
    regression: {
      line,
      slope,
      intercept,
    },
  }
}
