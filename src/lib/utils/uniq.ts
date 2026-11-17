import { uniq as lodashUniq, uniqBy as lodashUniqBy } from 'lodash-es'

export function uniq<T>(array: T[]): T[] {
  return lodashUniq(array) // NOSONAR(S8907) - only useful when removing lodash use
}

export function uniqBy<T>(array: T[], iteratee: (value: T) => unknown): T[] {
  return lodashUniqBy(array, iteratee)
}
