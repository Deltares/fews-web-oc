import { expect, test } from 'vitest'
import { uniq, uniqBy } from './uniq'

test('removes duplicate values while preserving their first occurrence order', () => {
  expect(uniq([3, 1, 3, 2, 1])).toEqual([3, 1, 2])
})

test('returns an empty array for empty input', () => {
  expect(uniq([])).toEqual([])
})

test('uniqBy keeps the first item for each iteratee result', () => {
  const items = [
    { id: 'a', value: 1 },
    { id: 'a', value: 2 },
    { id: 'b', value: 3 },
  ]

  expect(uniqBy(items, (item) => item.id)).toEqual([items[0], items[2]])
})

test('uniqBy returns an empty array for empty input', () => {
  expect(uniqBy([], () => undefined)).toEqual([])
})

test('uniqBy treats undefined iteratee results as duplicates', () => {
  const items = [
    { id: undefined, value: 1 },
    { id: undefined, value: 2 },
  ]

  expect(uniqBy(items, (item) => item.id)).toEqual([items[0]])
})
