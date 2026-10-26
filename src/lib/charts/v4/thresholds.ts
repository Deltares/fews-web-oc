import type { AlertLineOptions } from '@deltares/fews-web-oc-charts'
import type { ThresholdLine } from '@/lib/charts/types/ThresholdLine'

export function toV4AlertLineOptions(
  thresholds: ThresholdLine[],
): AlertLineOptions[] {
  return thresholds.map(
    ({ x1, x2, value, labelPosition, description, yAxisIndex, color }) => ({
      x1,
      x2,
      value,
      labelPosition,
      description,
      yAxisIndex,
      color,
    }),
  )
}
