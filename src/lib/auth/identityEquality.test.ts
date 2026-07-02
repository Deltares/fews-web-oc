import { describe, it, expect } from 'vitest'
import { hasEqualIdentity } from './identityEquality'

describe('hasEqualIdentity', () => {
  it('matches identical strings directly', () => {
    const a = 'user@example.com'
    const b = 'user@example.com'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })

  it('matches backend suffix vs email', () => {
    const a = 'lucas_van_der_meer_from_ocean0'
    const b = 'lucas.van_der_meer_from.oceanix@corp.com'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })

  it('matches when multiple digits are appended', () => {
    const a = 'anna_de_vries_finance12'
    const b = 'anna.de.vries.finance@company.org'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })

  it('matches dot vs underscore differences', () => {
    const a = 'mike_johnson_sales_team'
    const b = 'mike.johnson.sales.team'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })

  it('does not match when neither value is backend-truncated', () => {
    const a = 'oliver_smith_marketing_team'
    const b = 'oliver.smith.marketing.team@bigcorp.io'

    expect(hasEqualIdentity(a, b)).toBe(false)
  })

  it('ignores case differences', () => {
    const a = 'SARAH_CONNOR_SUPPORT'
    const b = 'sarah.connor.support'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })

  it('returns false for different identities', () => {
    const a = 'john_doe_engineering'
    const b = 'jane_doe_engineering'

    expect(hasEqualIdentity(a, b)).toBe(false)
  })

  it('returns false when prefixes differ after trimming suffix', () => {
    const a = 'alex_marketing_team9'
    const b = 'alex_sales_team@corp.com'

    expect(hasEqualIdentity(a, b)).toBe(false)
  })

  it('handles case where only one side has digits', () => {
    const a = 'emma_wilson_hr1'
    const b = 'emma.wilson.hr'

    expect(hasEqualIdentity(a, b)).toBe(true)
  })
})
