type Range = readonly unknown[]

function toTimeRange(range: Range | undefined): [number, number] | undefined {
  if (range?.length !== 2) return undefined
  const start = Number(range[0])
  const end = Number(range[1])
  return Number.isFinite(start) && Number.isFinite(end)
    ? [start, end]
    : undefined
}

// Date round-trips truncate to whole milliseconds
function isSameTimeRange(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1
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
