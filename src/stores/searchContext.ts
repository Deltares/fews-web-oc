import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Location, TopologyNode } from '@deltares/fews-pi-requests'

export type SearchItemType =
  | 'user'
  | 'project'
  | 'document'
  | 'location'
  | 'topology'

export interface SearchItem {
  id: string
  label: string
  iconName?: string
  params: Record<string, string | number | string[] | undefined>
  type: SearchItemType
  children?: SearchItem[]
}

export const useSearchContext = defineStore('searchContext', () => {
  // The dialog passes the user's input here.
  const search = ref('')

  const items = ref<SearchItem[]>([])

  const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
      return items.value
    }

    return items.value.filter((item) =>
      item.label.toLowerCase().includes(query),
    )
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

      return {
        id: location.locationId,
        label:
          location.locationName ?? location.shortName ?? location.locationId,
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

      return {
        id: `topology:${topologyId ?? 'default'}:${node.id}`,
        label: node.name ?? node.id,
        iconName: node.iconId,
        type: 'topology',
        params: {
          ...(topologyId === undefined ? {} : { topologyId }),
          nodeId: nodePath,
        },
        children: node.topologyNodes?.map((child) =>
          toSearchItem(child, nodePath),
        ),
      }
    }

    items.value = [
      ...nonTopologyItems,
      ...nodes.map((node) => toSearchItem(node, [])),
    ]
  }

  function getNestedLocationIds(item: SearchItem): string[] {
    return [
      item.id,
      ...(item.children?.flatMap(getNestedLocationIds) ?? []),
    ]
  }

  return {
    search,
    items,
    filteredItems,
    setLocations,
    setTopologyNodes,
  }
})
