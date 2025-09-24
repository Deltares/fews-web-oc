import { TimeSeriesDisplaySubplotItem } from '@deltares/fews-pi-requests'
import { ThresholdLine } from './types/ThresholdLine'

export function isUniqueThreshold(
  threshold: ThresholdLine,
  index: number,
  thresholds: ThresholdLine[],
): boolean {
  return (
    thresholds.findIndex(
      (t) =>
        t.value === threshold.value && t.description === threshold.description,
    ) === index
  )
}

export function getThresholdValues(
  thresholds: ThresholdLine[],
  thresholdAxisScaling: TimeSeriesDisplaySubplotItem['thresholdAxisScaling'],
): number[] {
  const values = thresholds.map((t) => t.value) ?? []
  switch (thresholdAxisScaling) {
    case 'two thresholds':
      return values.slice(0, 2)
    case 'no thresholds':
      return []
    case 'all thresholds':
    default:
      return values
  }
}
