import type { Collection } from './types'

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000

export function createCollection(name: string): Collection {
  return {
    name,
    charts: [],
    settings: {
      startTime: new Date(Date.now() - TWO_DAYS_IN_MS),
      endTime: new Date(Date.now() + TWO_DAYS_IN_MS),
    },
  }
}
