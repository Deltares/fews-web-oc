import type { SearchItem } from '@/stores/searchContext'

interface ItemMatch {
  ownMatch: boolean
  hasMatchingDescendant: boolean
}

export function matchSearchTree(roots: SearchItem[], query: string) {
  const matches = new Map<SearchItem, ItemMatch>()
  const defaultOpenedIds = new Set<string>()

  if (!query) {
    for (const item of roots) {
      defaultOpenedIds.add(item.id)
    }
    return { matchedRoots: roots, matches, defaultOpenedIds }
  }

  function visit(item: SearchItem): boolean {
    const ownMatch =
      item.normalizedLabel.includes(query) ||
      (item.type === 'location' && item.normalizedId.includes(query))
    let hasMatchingDescendant = false

    for (const child of item.children ?? []) {
      // Visit every child, even after finding a match, to cache the whole tree.
      if (visit(child)) {
        hasMatchingDescendant = true
      }
    }

    matches.set(item, { ownMatch, hasMatchingDescendant })
    if (hasMatchingDescendant) {
      defaultOpenedIds.add(item.id)
    }
    return ownMatch || hasMatchingDescendant
  }

  const matchedRoots = roots.filter(visit)
  for (const item of matchedRoots) {
    defaultOpenedIds.add(item.id)
  }

  return { matchedRoots, matches, defaultOpenedIds }
}
