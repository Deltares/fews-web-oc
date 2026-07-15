import { describe, expect, it } from 'vitest'
import {
  getNodeIdFromSelectTopologyNodeActionResult,
  getNodeIdFromSelectTopologyNodeEvent,
} from './selectTopologyNode'

describe('getNodeIdFromSelectTopologyNodeEvent', () => {
  it('returns nodeId for valid event detail', () => {
    expect(
      getNodeIdFromSelectTopologyNodeEvent({ nodeId: 'target-node' }),
    ).toBe('target-node')
  })

  it('trims nodeId from event detail', () => {
    expect(
      getNodeIdFromSelectTopologyNodeEvent({ nodeId: '  target-node  ' }),
    ).toBe('target-node')
  })

  it('returns undefined for empty or invalid nodeId values', () => {
    expect(getNodeIdFromSelectTopologyNodeEvent({ nodeId: '' })).toBeUndefined()
    expect(
      getNodeIdFromSelectTopologyNodeEvent({ nodeId: '   ' }),
    ).toBeUndefined()
    expect(
      getNodeIdFromSelectTopologyNodeEvent({ nodeId: 123 }),
    ).toBeUndefined()
    expect(getNodeIdFromSelectTopologyNodeEvent(undefined)).toBeUndefined()
  })
})

describe('getNodeIdFromSelectTopologyNodeActionResult', () => {
  it('returns nodeId from SELECT_TOPOLOGY_NODE_BY_ID action result', () => {
    const result = {
      type: 'SELECT_TOPOLOGY_NODE_BY_ID',
      requests: [{ request: 'target-node' }],
    }

    expect(getNodeIdFromSelectTopologyNodeActionResult(result as never)).toBe(
      'target-node',
    )
  })

  it('trims nodeId from action request payload', () => {
    const result = {
      type: 'SELECT_TOPOLOGY_NODE_BY_ID',
      requests: [{ request: '  target-node  ' }],
    }

    expect(getNodeIdFromSelectTopologyNodeActionResult(result as never)).toBe(
      'target-node',
    )
  })

  it('returns undefined for unsupported action type or invalid payload', () => {
    expect(
      getNodeIdFromSelectTopologyNodeActionResult({
        type: 'PI',
        requests: [{ request: 'target-node' }],
      } as never),
    ).toBeUndefined()

    expect(
      getNodeIdFromSelectTopologyNodeActionResult({
        type: 'SELECT_TOPOLOGY_NODE_BY_ID',
        requests: [{ request: '' }],
      } as never),
    ).toBeUndefined()

    expect(
      getNodeIdFromSelectTopologyNodeActionResult({
        type: 'SELECT_TOPOLOGY_NODE_BY_ID',
        requests: [{ request: '   ' }],
      } as never),
    ).toBeUndefined()

    expect(
      getNodeIdFromSelectTopologyNodeActionResult({
        type: 'SELECT_TOPOLOGY_NODE_BY_ID',
        requests: [],
      } as never),
    ).toBeUndefined()
  })
})
