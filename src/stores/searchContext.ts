import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { Location, TopologyNode } from '@deltares/fews-pi-requests'
import { topologyNodeIsVisible } from '@/lib/topology/nodes'

export type SearchItemType =
  'user' | 'project' | 'document' | 'location' | 'topology'

export interface SearchItem {
  id: string
  label: string
  normalizedLabel: string
  normalizedId: string
  iconName?: string
  params: Record<string, string | number | string[] | undefined>
  type: SearchItemType
  children?: SearchItem[]
}

export const useSearchContext = defineStore('searchContext', () => {
  // The dialog passes the user's input here.
  const search = ref('')

  // Replace the tree through the setters; nested items are not reactive.
  const items = shallowRef<SearchItem[]>([])

  const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
      return items.value
    }

    return items.value.filter((item) => item.normalizedLabel.includes(query))
  })

  function setLocations(locations: Location[]): void {
    const nonLocationItems = items.value.filter(
      (item) => item.type !== 'location',
    )
    const locationsByParent = new Map<string, Location[]>()

    for (const location of locations) {
      if (location.parentLocationId === undefined) continue

      const children = locationsByParent.get(location.parentLocationId) ?? []
      children.push(location)
      locationsByParent.set(location.parentLocationId, children)
    }

    function toSearchItem(location: Location): SearchItem {
      const children = locationsByParent.get(location.locationId)
      const label =
        location.locationName ?? location.shortName ?? location.locationId

      return {
        id: location.locationId,
        label,
        normalizedLabel: label.toLowerCase(),
        normalizedId: location.locationId.toLowerCase(),
        iconName: location.thresholdIconName ?? location.iconName,
        type: 'location',
        params: {
          locationId: location.locationId,
        },
        children: children?.map(toSearchItem),
      }
    }

    const locationItems = locations
      .filter((location) => location.parentLocationId === undefined)
      .map(toSearchItem)

    const nestedLocationIds = new Set(
      locationItems.flatMap((item) => getNestedLocationIds(item)),
    )
    const orphanedLocations = locations
      .filter((location) => !nestedLocationIds.has(location.locationId))
      .map(toSearchItem)

    items.value = [...nonLocationItems, ...locationItems, ...orphanedLocations]
  }

  function setTopologyNodes(
    nodes: TopologyNode[],
    topologyId: string | undefined,
  ): void {
    const nonTopologyItems = items.value.filter(
      (item) => item.type !== 'topology',
    )

    function toSearchItem(
      node: TopologyNode,
      parentNodeIds: string[],
    ): SearchItem {
      const nodePath = [...parentNodeIds, node.id]
      const visibleChildren = node.topologyNodes?.filter(topologyNodeIsVisible)
      const id = `topology:${topologyId ?? 'default'}:${node.id}`
      const label = node.name ?? node.id

      return {
        id,
        label,
        normalizedLabel: label.toLowerCase(),
        normalizedId: id.toLowerCase(),
        iconName: node.iconId,
        type: 'topology',
        params: {
          ...(topologyId === undefined ? {} : { topologyId }),
          nodeId: nodePath,
        },
        children: visibleChildren?.map((child) =>
          toSearchItem(child, nodePath),
        ),
      }
    }

    items.value = [
      ...nonTopologyItems,
      ...nodes
        .filter(topologyNodeIsVisible)
        .map((node) => toSearchItem(node, [])),
    ]
  }

  function getNestedLocationIds(item: SearchItem): string[] {
    return [item.id, ...(item.children?.flatMap(getNestedLocationIds) ?? [])]
  }

  return {
    search,
    items,
    filteredItems,
    setLocations,
    setTopologyNodes,
  }
})
