import { describe, expect, it } from 'vitest'
import { convertPropertiesToFewsPi } from './utils'
import { WhatIfProperty } from './types'

describe('convertPropertiesToFewsPi', () => {
  it('should convert dateTime properties to FEWS PI format', () => {
    const templateProperties: WhatIfProperty[] = [
      {
        id: 'startDate',
        type: 'dateTime',
      },
      {
        id: 'endDate',
        type: 'dateTime',
      },
    ]
    const properties = {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-02T00:00:00Z',
    }
    const converted = convertPropertiesToFewsPi(properties, templateProperties)
    expect(converted).toEqual({
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-02T00:00:00Z',
    })
  })

  it('should return properties unchanged if no template is provided', () => {
    const properties = {
      someKey: 'someValue',
      anotherKey: 123,
    }
    const converted = convertPropertiesToFewsPi(properties, undefined)
    expect(converted).toEqual(properties)
  })

  it('should return properties unchanged if template does not define types', () => {
    const templateProperties: WhatIfProperty[] = [
      { id: 'someKey', type: 'string' },
      { id: 'anotherKey', type: 'number' },
      { id: 'multiValueKey', type: 'multiProperty' },
    ]
    const properties = {
      someKey: 'someValue',
      anotherKey: 123,
      multiValueKey: [
        { code: '1', label: 'value1' },
        { code: '2', label: 'value2' },
      ],
    }
    const converted = convertPropertiesToFewsPi(properties, templateProperties)
    expect(converted).toEqual(properties)
  })
})
