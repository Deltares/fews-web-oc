import type { SeriesData } from '@/lib/timeseries/types/SeriesData'

export function calculateCorrelationTimeSeries(
  series1: SeriesData[],
  series2: SeriesData[],
  windowSize: number,
): SeriesData[] {
  if (series1.length !== series2.length || series1.length === 0) {
    return []
  }

  if (windowSize <= 0) {
    return []
  }

  const result: SeriesData[] = []

  for (let i = 0; i <= series1.length - windowSize; i++) {
    const window1 = series1.slice(i, i + windowSize)
    const window2 = series2.slice(i, i + windowSize)

    const validPairs = window1
      .map((point, index) => [point.y, window2[index]?.y])
      .filter(([y1, y2]) => y1 !== null && y2 !== null) as [number, number][]

    if (validPairs.length === 0) {
      result.push({
        x: series1[i + Math.floor(windowSize / 2)].x,
        y: null,
        flag: '9',
        flagSource: 'MAN',
        comment: 'No valid data in window',
      })
      continue
    }

    const n = validPairs.length
    const sumX = validPairs.reduce((sum, [x]) => sum + x, 0)
    const sumY = validPairs.reduce((sum, [, y]) => sum + y, 0)
    const sumXY = validPairs.reduce((sum, [x, y]) => sum + x * y, 0)
    const sumX2 = validPairs.reduce((sum, [x]) => sum + x * x, 0)
    const sumY2 = validPairs.reduce((sum, [, y]) => sum + y * y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    )

    const correlation = denominator === 0 ? null : numerator / denominator

    result.push({
      x: series1[i + Math.floor(windowSize / 2)].x, // Center of the window
      y: correlation,
      flag: '0',
      flagSource: 'MAN',
      comment: `Correlation for window starting at index ${i}`,
      user: '',
    })
  }

  return result
}
