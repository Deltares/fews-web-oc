import { describe, expect, it } from 'vitest'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import type { ActionResult } from '@deltares/fews-pi-requests'
import { addIndexToKeys } from '@/lib/display/utils'

describe('addIndexToKeys', () => {
  it('uses a deterministic hash for each request', () => {
    const request = '/timeseries?documentVersion=1'
    const results = [{ requests: [{ request }] }] as ActionResult[]

    addIndexToKeys(results)

    expect(results[0].requests[0].key).toBe(
      bytesToHex(sha256(utf8ToBytes(request))),
    )
  })
})
