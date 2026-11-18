import { describe, expect, test } from 'vitest'
import { isWholeNumberMemberId, sortEnsembleMemberIds } from './sort'

describe('isWholeNumberMemberId', () => {
  test.each(['0', '12', '-1', '007'])('accepts %j', (memberId) => {
    expect(isWholeNumberMemberId(memberId)).toBe(true)
  })

  test.each(['', ' ', '1.5', '0x10', '1e3', ' 1', 'ctrl', 'p01'])(
    'rejects %j',
    (memberId) => {
      expect(isWholeNumberMemberId(memberId)).toBe(false)
    },
  )
})

describe('sortEnsembleMemberIds', () => {
  test('sorts whole numbers numerically', () => {
    expect(sortEnsembleMemberIds(['10', '2', '1', '-1'])).toEqual([
      '-1',
      '1',
      '2',
      '10',
    ])
  })

  test('sorts members with the same value deterministically', () => {
    expect(sortEnsembleMemberIds(['01', '1', '2'])).toEqual(['01', '1', '2'])
    expect(sortEnsembleMemberIds(['1', '01', '2'])).toEqual(['01', '1', '2'])
  })

  test('sorts alphabetically if not all members are whole numbers', () => {
    expect(sortEnsembleMemberIds(['10', '9', '0x10'])).toEqual([
      '0x10',
      '10',
      '9',
    ])
    expect(sortEnsembleMemberIds(['p02', 'ctrl', 'p01'])).toEqual([
      'ctrl',
      'p01',
      'p02',
    ])
  })

  test('does not treat an empty member ID as a number', () => {
    expect(sortEnsembleMemberIds(['2', '', '10'])).toEqual(['', '10', '2'])
  })
})
