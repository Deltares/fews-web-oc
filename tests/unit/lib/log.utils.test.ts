import { describe, expect, it } from 'vitest'
import {
  canOpenTaskRunLogs,
  createRouteToken,
  parseLogTextSegments,
} from '@/lib/log/utils'

describe('log route token helpers', () => {
  describe('createRouteToken', () => {
    it('creates a route token with the provided path', () => {
      expect(createRouteToken('/topology/abc/node/def?tab=log')).toBe(
        '[[route:/topology/abc/node/def?tab=log]]',
      )
    })
  })

  describe('canOpenTaskRunLogs', () => {
    it('returns false when the configured log display only has manual logs', () => {
      expect(
        canOpenTaskRunLogs({
          id: 'log-1',
          name: 'manual-only',
          manualLog: { noteGroupId: 'note-group-1' },
        }),
      ).toBe(false)
    })

    it('returns true when the configured log display has system logs', () => {
      expect(
        canOpenTaskRunLogs({
          id: 'log-1',
          name: 'system-enabled',
          manualLog: { noteGroupId: 'note-group-1' },
          systemLog: { logLevel: 'INFO' },
        }),
      ).toBe(true)
    })
  })

  describe('parseLogTextSegments', () => {
    it('returns a single text segment when no route token exists', () => {
      expect(parseLogTextSegments('Plain message')).toEqual([
        { type: 'text', text: 'Plain message' },
      ])
    })

    it('parses one route token between text segments', () => {
      expect(
        parseLogTextSegments('Check [[route:/topology/1/node/A/log]] now'),
      ).toEqual([
        { type: 'text', text: 'Check ' },
        {
          type: 'route',
          to: '/topology/1/node/A/log',
          label: '/topology/1/node/A/log',
        },
        { type: 'text', text: ' now' },
      ])
    })

    it('parses multiple route tokens in one message', () => {
      expect(
        parseLogTextSegments(
          'Before [[route:/topology/1]] middle [[route:/map/location/X]] after',
        ),
      ).toEqual([
        { type: 'text', text: 'Before ' },
        { type: 'route', to: '/topology/1', label: '/topology/1' },
        { type: 'text', text: ' middle ' },
        { type: 'route', to: '/map/location/X', label: '/map/location/X' },
        { type: 'text', text: ' after' },
      ])
    })

    it('keeps malformed empty route tokens as plain text', () => {
      expect(parseLogTextSegments('Broken [[route:   ]] token')).toEqual([
        { type: 'text', text: 'Broken [[route:   ]] token' },
      ])
    })
  })
})
