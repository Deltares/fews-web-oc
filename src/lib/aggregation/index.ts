import { Duration, type DurationLikeObject } from 'luxon'

export interface AggregationItem {
  id: string
  type: string
  label: string
  shortLabel: string
  icon?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Converts a FEWS aggregation label to a short, human-readable duration label.
 *
 * @param label - A FEWS aggregation label in the format of "number unit(s)" (e.g., "1 day", "2 hours", "3 weeks")
 * @returns A short, localized human-readable representation of the duration using narrow unit display,
 *          or the original label if parsing fails
 *
 * @example
 * ```typescript
 * shortLabel("1 day") // returns "1d" (in English locale)
 * shortLabel("2 hours") // returns "2h" (in English locale)
 * ```
 */
export function shortLabel(label: string): string {
  const duration = Duration.fromObject(fewsAggregationLabelToDuration(label), {
    locale: 'en',
  })
  return duration.toHuman({ unitDisplay: 'narrow' }) ?? label
}

/**
 * Calculates the start date based on a FEWS aggregation label and an optional end date.
 * If the end date is not provided, the function returns undefined.
 *
 * @param label - A FEWS aggregation label string in the format "number unit(s)"
 * @param endDate - An optional end date to calculate the start date from
 * @returns The calculated start date, or undefined if the end date is not provided or parsing fails
 * @example
 * ```typescript
 * getRelativeStartDateForLabel("5 days", new Date("2024-06-10")) // returns Date representing "2024-06-05"
 * getRelativeStartDateForLabel("1 hour", new Date("2024-06-10T12:00:00")) // returns Date representing "2024-06-10T11:00:00"
 * getRelativeStartDateForLabel("invalid", new Date("2024-06-10")) // returns undefined
 * ```
 */
export function getRelativeStartDateForLabel(
  label: string,
  endDate: Date | undefined,
): Date | undefined {
  if (!endDate) return

  const durationObj = fewsAggregationLabelToDuration(label)
  if (Object.keys(durationObj).length === 0) return

  const duration = Duration.fromObject(durationObj)
  const endDateTime = Duration.fromMillis(endDate.getTime())
  const startDateTime = endDateTime.minus(duration)

  return new Date(startDateTime.toMillis())
}

/**
 * Parses a FEWS aggregation label and converts it to a Luxon DurationLikeObject.
 *
 * @param label - A FEWS aggregation label string in the format "number unit(s)"
 *                where unit can be: year, month, week, day, minute, hour, or second
 * @returns A DurationLikeObject with the parsed duration value, or an empty object if parsing fails
 *
 * @example
 * ```typescript
 * fewsAggregationLabelToDuration("5 days") // returns { day: 5 }
 * fewsAggregationLabelToDuration("1 hour") // returns { hour: 1 }
 * fewsAggregationLabelToDuration("invalid") // returns {}
 * ```
 */
function fewsAggregationLabelToDuration(label: string): DurationLikeObject {
  const regex =
    /(?<value>\d+)\s(?<unit>year|month|week|day|minute|hour|second)s?/
  const match = label.match(regex)
  if (match?.groups) {
    const { unit, value } = match.groups
    return { [unit]: parseInt(value) }
  }
  return {}
}
