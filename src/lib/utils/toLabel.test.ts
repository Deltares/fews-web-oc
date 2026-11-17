import { expect, test } from 'vitest'
import { toLabel } from './toLabel'

test('replaces dashes and underscores by a single space', () => {
  expect(toLabel('ecmwf_ens-high__res')).toBe('ecmwf ens high res')
})

test('preserves capitalization', () => {
  expect(toLabel('ECMWF_ENS-iFlows')).toBe('ECMWF ENS iFlows')
})

test('ignores leading and trailing separators', () => {
  expect(toLabel('_GFS-')).toBe('GFS')
})

test('keeps numbers', () => {
  expect(toLabel('EPS_51')).toBe('EPS 51')
})
