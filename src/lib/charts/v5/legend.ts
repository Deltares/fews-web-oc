import {
  createLegendSwatch,
  type LegendEntry,
} from '@deltares/fews-web-oc-charts'
import { getMatchingIndexedString, type Tag } from '@/lib/charts/tags'

export function getV5LegendTags(
  entries: readonly LegendEntry[],
  forecastLegend?: string,
): Tag[] {
  const serializer = new XMLSerializer()

  return entries.map((entry) => ({
    id: entry.id,
    name: entry.label,
    disabled: entry.visibility === 'hidden',
    legendSvg: serializer.serializeToString(
      createLegendSwatch(getLegendSymbol(entry)),
    ),
    tooltip: getMatchingIndexedString(entry.label, forecastLegend),
    interactive: !entry.disabled,
  }))
}

function getLegendSymbol(entry: LegendEntry): LegendEntry['symbol'] {
  const child = entry.children[0]
  return child ? getLegendSymbol(child) : entry.symbol
}
