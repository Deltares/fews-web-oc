/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { getRelativeUrlForRequest } from './index'

function makeRequest(request: string): ActionRequest {
  return { request } as ActionRequest
}

test('strips thinning for grid time series requests', () => {
  Object.defineProperty(window, 'outerWidth', {
    value: 1000,
    configurable: true,
  })

  const relativeUrl = getRelativeUrlForRequest(
    'http://localhost:8080',
    {
      thinning: true,
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-02T00:00:00.000Z'),
    },
    makeRequest('/timeseries/grid?documentFormat=PI_JSON&thinning=1234'),
  )

  const url = new URL(relativeUrl, 'http://localhost')
  expect(url.pathname).toBe('/timeseries/grid')
  expect(url.searchParams.has('thinning')).toBe(false)
  expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
})

test('keeps thinning behavior for non-grid time series requests', () => {
  Object.defineProperty(window, 'outerWidth', {
    value: 1000,
    configurable: true,
  })

  const relativeUrl = getRelativeUrlForRequest(
    'http://localhost:8080',
    {
      thinning: true,
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-02T00:00:00.000Z'),
    },
    makeRequest('/timeseries?documentFormat=PI_JSON'),
  )

  const url = new URL(relativeUrl, 'http://localhost')
  expect(url.pathname).toBe('/timeseries')
  expect(url.searchParams.get('documentFormat')).toBe('PI_JSON')
  expect(url.searchParams.has('thinning')).toBe(true)
  expect(url.searchParams.get('thinning')).toBe('172800')
})
