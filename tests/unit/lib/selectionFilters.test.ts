import { describe, expect, it } from 'vitest'
import { createSelectionFilters } from '../../../src/lib/analysis/selectionFilters'

describe('createSelectionFilters', () => {
  it('returns no filters when the active filter or locations are missing', () => {
    const parameters = [{ id: 'parameter-1', parameterGroup: 'group-1' }]

    expect(
      createSelectionFilters(undefined, ['location-1'], parameters, []),
    ).toEqual([])
    expect(createSelectionFilters('filter-1', [], parameters, [])).toEqual([])
  })

  it('groups selected parameters and includes selected locations and sources', () => {
    const filters = createSelectionFilters(
      'filter-1',
      ['location-1', 'location-2'],
      [
        { id: 'parameter-1', parameterGroup: 'group-1' },
        { id: 'parameter-2', parameterGroup: 'group-2' },
        { id: 'parameter-3', parameterGroup: 'group-1' },
        undefined,
      ],
      ['source-1', 'source-2'],
    )

    expect(filters).toEqual([
      {
        filterId: 'filter-1',
        locationIds: 'location-1,location-2',
        parameterIds: 'parameter-1,parameter-3',
        moduleInstanceIds: 'source-1,source-2',
      },
      {
        filterId: 'filter-1',
        locationIds: 'location-1,location-2',
        parameterIds: 'parameter-2',
        moduleInstanceIds: 'source-1,source-2',
      },
    ])
  })

  it('omits ungrouped parameters and leaves sources unset when empty', () => {
    const filters = createSelectionFilters(
      'filter-1',
      ['location-1'],
      [
        { id: 'parameter-1', parameterGroup: 'group-1' },
        { id: 'parameter-2', parameterGroup: undefined },
      ],
      [],
    )

    expect(filters).toEqual([
      {
        filterId: 'filter-1',
        locationIds: 'location-1',
        parameterIds: 'parameter-1',
        moduleInstanceIds: undefined,
      },
    ])
  })

  it('supports parameter groups that overlap object prototype keys', () => {
    expect(
      createSelectionFilters(
        'filter-1',
        ['location-1'],
        [{ id: 'parameter-1', parameterGroup: '__proto__' }],
        [],
      ),
    ).toEqual([
      {
        filterId: 'filter-1',
        locationIds: 'location-1',
        parameterIds: 'parameter-1',
        moduleInstanceIds: undefined,
      },
    ])
  })
})
