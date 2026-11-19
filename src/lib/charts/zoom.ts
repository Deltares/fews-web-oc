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

/** Whether two time ranges, as dates or epoch milliseconds, overlap */
export function overlapsTimeRange(
  a: Range | undefined,
  b: Range | undefined,
): boolean {
  const rangeA = toTimeRange(a)
  const rangeB = toTimeRange(b)
  if (!rangeA || !rangeB) return false
  return rangeA[0] < rangeB[1] && rangeA[1] > rangeB[0]
}
