type Range = readonly unknown[]

function toTimeRange(range: Range | undefined): [number, number] | undefined {
  if (range?.length !== 2) return undefined
  const start = Number(range[0])
  const end = Number(range[1])
  return Number.isFinite(start) && Number.isFinite(end)
    ? [start, end]
    : undefined
}

/**
 * Whether two time ranges, as dates or epoch milliseconds, are the same.
 * Date round-trips truncate to whole milliseconds, so sub-millisecond
 * differences count as the same range.
 */
export function isSameTimeRange(
  a: Range | undefined,
  b: Range | undefined,
): boolean {
  const rangeA = toTimeRange(a)
  const rangeB = toTimeRange(b)
  if (!rangeA || !rangeB) return false
  return (
    Math.abs(rangeA[0] - rangeB[0]) < 1 && Math.abs(rangeA[1] - rangeB[1]) < 1
  )
}

/**
 * Whether to keep the visible time range when the default range of a chart
 * changes or the chart is rebuilt, e.g. when a running period moves with the
 * system time or the data is refreshed.
 *
 * The visible range is kept when the user zoomed or panned away from the
 * previous default range, as long as it still overlaps the next default range.
 * Otherwise the chart shows the next default range.
 */
export function shouldKeepVisibleTimeRange(
  visible: Range | undefined,
  previousDefault: Range | undefined,
  nextDefault: Range | undefined,
): boolean {
  const visibleRange = toTimeRange(visible)
  const previousRange = toTimeRange(previousDefault)
  const nextRange = toTimeRange(nextDefault)
  if (!visibleRange || !previousRange || !nextRange) return false
  if (isSameTimeRange(visibleRange, previousRange)) return false
  return visibleRange[0] < nextRange[1] && visibleRange[1] > nextRange[0]
}
