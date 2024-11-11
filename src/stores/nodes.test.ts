import { describe, expect, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNodesStore } from './nodes'

const nodeButtons = [
  {
    id: '1',
    name: 'node1',
    to: 'node1',
  },
  {
    id: '2',
    name: 'node2',
    to: 'node2',
  },
]

describe('Nodes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should set node buttons', () => {
    const nodesStore = useNodesStore()
    nodesStore.setNodeButtons(nodeButtons)
    expect(nodesStore.nodeButtons).toEqual(nodeButtons)
  })

  it('should set active parent id on setting node buttons', () => {
    const nodesStore = useNodesStore()
    nodesStore.setNodeButtons(nodeButtons)
    expect(nodesStore.activeParentId).toBe(nodeButtons[0].id)
  })

  it('should get first route target without set parentId', () => {
    const nodesStore = useNodesStore()
    nodesStore.setNodeButtons(nodeButtons)
    expect(nodesStore.getRouteTarget(nodeButtons)).toBe(nodeButtons[0].to)
  })

  it('should get route target with set parentId', () => {
    const nodesStore = useNodesStore()
    nodesStore.setNodeButtons(nodeButtons)
    nodesStore.activeParentId = nodeButtons[1].id
    expect(nodesStore.getRouteTarget(nodeButtons)).toBe(nodeButtons[1].to)
  })

  it('should set activeParentNode and Id on getting route target', () => {
    const nodesStore = useNodesStore()
    nodesStore.setNodeButtons(nodeButtons)
    nodesStore.activeParentId = nodeButtons[1].id
    nodesStore.getRouteTarget(nodeButtons)

    expect(nodesStore.activeParentNode).toBe(1)
    expect(nodesStore.activeParentId).toBe(nodeButtons[1].id)
  })
})
