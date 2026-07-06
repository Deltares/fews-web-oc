/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { getRelativeUrlForRequest } from './index'

function makeRequest(request: string): ActionRequest {
  return { request }
}

test('adds thinning when options.thinning is true for grid time series requests', () => {
  const relativeUrl = getRelativeUrlForRequest(
    'http://localhost:8080',
    {
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-02T00:00:00.000Z'),
      thinning: true,
    },
    makeRequest('/timeseries/grid?documentFormat=PI_JSON'),
  )

  const url = new URL(relativeUrl, 'http://localhost')
  expect(url.pathname).toBe('/timeseries/grid')
  expect(url.searchParams.has('thinning')).toBe(true)
  expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
})

test('adds thinning when options.thinning is true for non-grid time series requests', () => {
  const relativeUrl = getRelativeUrlForRequest(
    'http://localhost:8080',
    {
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-02T00:00:00.000Z'),
      thinning: true,
    },
    makeRequest('/timeseries?documentFormat=PI_JSON'),
  )

  const url = new URL(relativeUrl, 'http://localhost')
  expect(url.pathname).toBe('/timeseries')
  expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
  expect(url.searchParams.has('thinning')).toBe(true)
})

test('does not add thinning when options.thinning is disabled', () => {
  const relativeUrl = getRelativeUrlForRequest(
    'http://localhost:8080',
    {
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-02T00:00:00.000Z'),
    },
    makeRequest('/timeseries?documentFormat=PI_JSON'),
  )

  const url = new URL(relativeUrl, 'http://localhost')
  expect(url.pathname).toBe('/timeseries')
  expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
  expect(url.searchParams.has('thinning')).toBe(false)
})
