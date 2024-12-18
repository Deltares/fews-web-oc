import { AbsolutePeriod, RelativePeriod } from './types'

export function convertRelativeToAbsolutePeriod(
  relative: RelativePeriod,
  reference?: Date,
): AbsolutePeriod {
  const referenceTimestamp = reference?.getTime() ?? Date.now()
  return {
    startTimestamp: referenceTimestamp + relative.startOffsetSeconds * 1000,
    endTimestamp: referenceTimestamp + relative.endOffsetSeconds * 1000,
  }
}
