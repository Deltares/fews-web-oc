import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'
import type { SearchItem } from '@/stores/searchContext'
import { matchSearchTree } from './tree'

function location(
  id: string,
  label: string,
  children?: SearchItem[],
): SearchItem {
  return {
    id,
    label,
    normalizedId: id.toLowerCase(),
    normalizedLabel: label.toLowerCase(),
    type: 'location',
    params: { locationId: id },
    children,
  }
}

describe('matchSearchTree', () => {
  it('opens only roots for an empty query without matching descendants', () => {
    const child = location('child', 'Child')
    const root = location('root', 'Root', [child])
    const roots = [root]
    const result = matchSearchTree(roots, '')

    expect(result.matchedRoots).toBe(roots)
    expect(result.defaultOpenedIds).toEqual(new Set(['root']))
    expect(result.matches.size).toBe(0)
  })

  it('retains ancestors and opens the paths to matches in every branch', () => {
    const first = location('first', 'Water Level')
    const second = location('second', 'Water Flow')
    const branch = location('branch', 'Branch', [second])
    const unrelated = location('unrelated', 'Unrelated')
    const root = location('root', 'Root', [first, branch, unrelated])
    const excluded = location('excluded', 'Excluded')
    const result = matchSearchTree([root, excluded], 'water')

    expect(result.matchedRoots).toEqual([root])
    expect(result.defaultOpenedIds).toEqual(new Set(['root', 'branch']))
    expect(result.matches.get(root)).toEqual({
      ownMatch: false,
      hasMatchingDescendant: true,
    })
    expect(result.matches.get(branch)?.hasMatchingDescendant).toBe(true)
    expect(result.matches.get(first)?.ownMatch).toBe(true)
    expect(result.matches.get(second)?.ownMatch).toBe(true)
    expect(result.matches.get(unrelated)).toEqual({
      ownMatch: false,
      hasMatchingDescendant: false,
    })
    expect(result.matches.size).toBe(6)
  })

  it('keeps descendants cached when a parent matches without opening unrelated branches', () => {
    const leaf = location('leaf', 'Station')
    const branch = location('branch', 'Branch', [leaf])
    const root = location('root', 'Water Basin', [branch])
    const result = matchSearchTree([root], 'water')

    expect(result.matchedRoots).toEqual([root])
    expect(result.defaultOpenedIds).toEqual(new Set(['root']))
    expect(result.matches.get(root)).toEqual({
      ownMatch: true,
      hasMatchingDescendant: false,
    })
    expect(result.matches.get(branch)).toEqual({
      ownMatch: false,
      hasMatchingDescendant: false,
    })
    expect(result.matches.has(leaf)).toBe(true)
  })

  it('matches location IDs but not route IDs', () => {
    const station = location('Station-A', 'Water Level')
    const route: SearchItem = {
      ...location('topology:Station-A', 'River Map'),
      type: 'topology',
    }

    expect(
      matchSearchTree([station, route], 'station-a').matchedRoots,
    ).toEqual([station])
    expect(matchSearchTree([route], 'river').matchedRoots).toEqual([route])
  })

  it('returns no roots or opened IDs when nothing matches', () => {
    const root = location('root', 'Root', [location('child', 'Child')])
    const result = matchSearchTree([root], 'missing')

    expect(result.matchedRoots).toEqual([])
    expect(result.defaultOpenedIds.size).toBe(0)
    expect(result.matches.size).toBe(2)
    expect(matchSearchTree([], 'water').matches.size).toBe(0)
  })

  it('evaluates all 20,000 nodes once and reuses matches until the query or tree changes', () => {
    let labelReads = 0
    const roots = shallowRef(
      Array.from({ length: 20_000 }, (_, index) => ({
        ...location(`station-${index}`, `Water Level ${index}`),
        get normalizedLabel() {
          labelReads++
          return `water level ${index}`
        },
      })),
    )
    const query = ref('water')
    const result = computed(() => matchSearchTree(roots.value, query.value))

    expect(result.value.matches.size).toBe(20_000)
    expect(labelReads).toBe(20_000)
    const initial = result.value
    expect(result.value.matchedRoots).toHaveLength(20_000)
    expect(result.value.defaultOpenedIds.size).toBe(20_000)
    for (const item of roots.value) {
      expect(result.value.matches.get(item)?.ownMatch).toBe(true)
    }
    expect(result.value).toBe(initial)
    expect(labelReads).toBe(20_000)

    query.value = '19999'
    expect(result.value.matchedRoots).toEqual([roots.value[19_999]])
    expect(labelReads).toBe(40_000)

    roots.value = roots.value.slice(0, 1)
    expect(result.value.matchedRoots).toEqual([])
    expect(labelReads).toBe(40_001)
  })
})
