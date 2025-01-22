import { expect, test, describe } from 'vitest'
import { combineUrls } from './url'

describe('combineUrls', () => {
  test('combine two urls', () => {
    expect(combineUrls('http://example.com', 'api')).toEqual(
      'http://example.com/api',
    )
  })

  test('combine two urls with trailing and leading slashes', () => {
    expect(combineUrls('http://example.com/', '/api')).toEqual(
      'http://example.com/api',
    )
  })

  test('combine two urls with leading slash', () => {
    expect(combineUrls('/dashboard/', '/api')).toEqual('/dashboard/api')
  })

  test('combine two urls with trailing slash', () => {
    expect(combineUrls('dashboard/', '/api')).toEqual('dashboard/api')
  })

  test('combine two urls without slashes', () => {
    expect(combineUrls('dashboard', 'api')).toEqual('dashboard/api')
  })

  test('combine two urls with empty string', () => {
    expect(combineUrls('', 'api')).toEqual('/api')
  })
})
