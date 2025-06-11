import type { Collection } from './types'

const MS_IN_TWO_DAYS = 2 * 24 * 60 * 60 * 1000
const MS_IN_FIVE_MINUTES = 5 * 60 * 1000

export function createCollection(name: string): Collection {
  return {
    name,
    charts: [],
    settings: {
      // FIXME: Currently the backend for correlation only supports 5 minute intervals
      startTime: roundToNearestFiveMinutes(Date.now() - MS_IN_TWO_DAYS),
      endTime: roundToNearestFiveMinutes(Date.now() + MS_IN_TWO_DAYS),
    },
  }
}

function roundToNearestFiveMinutes(time: number): Date {
  return new Date(Math.round(time / MS_IN_FIVE_MINUTES) * MS_IN_FIVE_MINUTES)
}
