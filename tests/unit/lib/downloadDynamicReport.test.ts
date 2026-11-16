import { describe, expect, it } from 'vitest'
import { getDynamicReportFileName } from '@/lib/download/downloadDynamicReport'

describe('getDynamicReportFileName', () => {
  it('joins the filter parts and replaces unsafe characters', () => {
    expect(
      getDynamicReportFileName({
        displayId: 'node/report',
        locationId: 'loc:1',
        time: '2024-01-01T00:00:00Z',
      }),
    ).toBe('node_report-loc_1-2024-01-01T00_00_00Z')
  })

  it('skips missing parts', () => {
    expect(getDynamicReportFileName({ displayId: 'report' })).toBe('report')
  })
})
