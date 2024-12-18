import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTopologyNodesStore } from './topologyNodes'
import { nextTick } from 'vue'

describe('Toplogy Nodes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should get nodes by id', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getNodeById('1')).toEqual({
      id: '1',
      name: 'Node 1',
    })
  })

  it('should get nodes by id with duplicate ids', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '1', name: 'Node 1 Duplicate' },
      { id: '3', name: 'Node 3' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getNodeById('1')).toEqual({
      id: '1',
      name: 'Node 1 Duplicate',
    })
  })

  it('should get nodes by id with no nodes', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    topologyNodesStore.nodes = []

    await nextTick()

    expect(topologyNodesStore.getNodeById('1')).toBeUndefined()
  })

  it('should get nodes by id before fetch', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    expect(topologyNodesStore.getNodeById('1')).toBeUndefined()
  })

  it('should get parent node by id', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2', topologyNodes: [{ id: '3', name: 'Node 3' }] },
      { id: '4', name: 'Node 4' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getParentNodeById('3')).toEqual({
      id: '2',
      name: 'Node 2',
      topologyNodes: [{ id: '3', name: 'Node 3' }],
    })
  })

  it('should get parent node by id with no parent', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getParentNodeById('3')).toBeUndefined()
  })

  it('should get parent node by id with no nodes', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    topologyNodesStore.nodes = []

    await nextTick()

    expect(topologyNodesStore.getParentNodeById('3')).toBeUndefined()
  })

  it('should get sub nodes for ids', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getSubNodesForIds(['1', '2'])).toEqual([
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
    ])
  })

  it('should get sub nodes for ids with no ids', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ]
    topologyNodesStore.nodes = topology

    await nextTick()

    expect(topologyNodesStore.getSubNodesForIds()).toEqual([
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ])
  })

  it('should get sub nodes for ids with no nodes', async () => {
    const topologyNodesStore = useTopologyNodesStore()
    topologyNodesStore.nodes = []

    await nextTick()

    expect(topologyNodesStore.getSubNodesForIds()).toEqual([])
  })
})
