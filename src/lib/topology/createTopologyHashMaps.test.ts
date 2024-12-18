import { describe, it, expect } from 'vitest'
import { createTopologyHashMaps } from './createTopologyHashMaps'

describe('createTopologyHashMap', () => {
  it('should create a hash map from a valid topology', () => {
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
      { id: '3', name: 'Node 3' },
    ]
    const result = createTopologyHashMaps(topology)
    expect(result).toEqual({
      childIdToParentNodeMap: new Map(),
      idToNodeMap: new Map(
        Object.entries({
          '1': { id: '1', name: 'Node 1' },
          '2': { id: '2', name: 'Node 2' },
          '3': { id: '3', name: 'Node 3' },
        }),
      ),
    })
  })

  it('should return an empty maps for an empty topology', () => {
    const topology: any[] = []
    const result = createTopologyHashMaps(topology)
    expect(result).toEqual({
      childIdToParentNodeMap: new Map(),
      idToNodeMap: new Map(),
    })
  })

  it('should handle topology with duplicate ids', () => {
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '1', name: 'Node 1 Duplicate' },
      { id: '3', name: 'Node 3' },
    ]
    const result = createTopologyHashMaps(topology)
    expect(result).toEqual({
      childIdToParentNodeMap: new Map(),
      idToNodeMap: new Map(
        Object.entries({
          '1': { id: '1', name: 'Node 1 Duplicate' },
          '3': { id: '3', name: 'Node 3' },
        }),
      ),
    })
  })

  it('should handle a nested topology', () => {
    const topology = [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2', topologyNodes: [{ id: '3', name: 'Node 3' }] },
      { id: '4', name: 'Node 4' },
    ]
    const result = createTopologyHashMaps(topology)
    expect(result).toEqual({
      childIdToParentNodeMap: new Map(
        Object.entries({
          '3': {
            id: '2',
            name: 'Node 2',
            topologyNodes: [{ id: '3', name: 'Node 3' }],
          },
        }),
      ),
      idToNodeMap: new Map(
        Object.entries({
          '1': { id: '1', name: 'Node 1' },
          '2': {
            id: '2',
            name: 'Node 2',
            topologyNodes: [{ id: '3', name: 'Node 3' }],
          },
          '3': { id: '3', name: 'Node 3' },
          '4': { id: '4', name: 'Node 4' },
        }),
      ),
    })
  })

  it('should handle a deeply nested topology', () => {
    const topology = [
      { id: '1', name: 'Node 1' },
      {
        id: '2',
        name: 'Node 2',
        topologyNodes: [
          {
            id: '3',
            name: 'Node 3',
            topologyNodes: [{ id: '4', name: 'Node 4' }],
          },
        ],
      },
      { id: '5', name: 'Node 5' },
    ]
    const result = createTopologyHashMaps(topology)
    expect(result).toEqual({
      childIdToParentNodeMap: new Map(
        Object.entries({
          '3': {
            id: '2',
            name: 'Node 2',
            topologyNodes: [
              {
                id: '3',
                name: 'Node 3',
                topologyNodes: [{ id: '4', name: 'Node 4' }],
              },
            ],
          },
          '4': {
            id: '3',
            name: 'Node 3',
            topologyNodes: [{ id: '4', name: 'Node 4' }],
          },
        }),
      ),
      idToNodeMap: new Map(
        Object.entries({
          '1': { id: '1', name: 'Node 1' },
          '2': {
            id: '2',
            name: 'Node 2',
            topologyNodes: [
              {
                id: '3',
                name: 'Node 3',
                topologyNodes: [{ id: '4', name: 'Node 4' }],
              },
            ],
          },
          '3': {
            id: '3',
            name: 'Node 3',
            topologyNodes: [{ id: '4', name: 'Node 4' }],
          },
          '4': { id: '4', name: 'Node 4' },
          '5': { id: '5', name: 'Node 5' },
        }),
      ),
    })
  })
})
