import { describe, expect, it } from 'vitest'

import { getSidePanelTypeForShowComponent } from '@/lib/sidepanel/showComponent'

describe('getSidePanelTypeForShowComponent', () => {
  it('returns null when no panel is configured', () => {
    expect(getSidePanelTypeForShowComponent(undefined, [])).toBeNull()
    expect(getSidePanelTypeForShowComponent('None', [])).toBeNull()
  })

  it('returns the configured panel', () => {
    expect(getSidePanelTypeForShowComponent('runTask', ['runTask'])).toBe(
      'runTask',
    )
  })

  it('maps shareOptions to the share panel', () => {
    expect(getSidePanelTypeForShowComponent('shareOptions', ['share'])).toBe(
      'share',
    )
  })

  it('uses the import status panel for export status when both are enabled', () => {
    expect(
      getSidePanelTypeForShowComponent('exportStatus', ['importStatus']),
    ).toBe('importStatus')
  })

  it('uses the export status panel when only export status is enabled', () => {
    expect(
      getSidePanelTypeForShowComponent('exportStatus', ['exportStatus']),
    ).toBe('exportStatus')
  })
})
