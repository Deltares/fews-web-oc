import { describe, expect, it } from 'vitest'
import { redactDiagnosticText } from '../../../src/lib/startup/diagnostics'

describe('copied startup diagnostics', () => {
  it.each([
    'password',
    'passwd',
    'client_secret',
    'access_token',
    'refresh_token',
    'id_token',
    'api-key',
    'api_key',
    'apikey',
    'Authorization',
    'set-cookie',
  ])('redacts assignment values for %s', (key) => {
    expect(redactDiagnosticText(`${key}=example-value`)).toBe(
      `${key}=[redacted]`,
    )
    expect(redactDiagnosticText(`"${key}": "value with spaces"`)).toBe(
      `"${key}": [redacted]`,
    )
    expect(redactDiagnosticText(`'${key}': 'value with spaces'`)).toBe(
      `'${key}': [redacted]`,
    )
  })

  it('preserves non-sensitive assignments alongside sensitive ones', () => {
    expect(
      redactDiagnosticText(
        'status=503, token=example-value; stage="Load configuration"',
      ),
    ).toBe('status=503, token=[redacted]; stage="Load configuration"')
  })

  it('redacts sensitive assignments inside non-sensitive quoted values', () => {
    expect(
      redactDiagnosticText(
        '{"error":"Provider failed with token=private-value due to retry"}',
      ),
    ).toBe('{"error":"Provider failed with token=[redacted] due to retry"}')
  })

  it('handles long keys without an assignment delimiter', () => {
    const text = 'a'.repeat(100_000)
    expect(redactDiagnosticText(text)).toBe(text)
  })

  it('handles long whitespace without an assignment delimiter', () => {
    const text = `token${' '.repeat(100_000)}end`
    expect(redactDiagnosticText(text)).toBe(text)
  })

  it('handles many non-matching keys before a sensitive assignment', () => {
    const prefix = 'ordinary '.repeat(10_000)
    expect(redactDiagnosticText(`${prefix}token=example-value`)).toBe(
      `${prefix}token=[redacted]`,
    )
  })

  it('redacts the rest of an unterminated sensitive quoted value', () => {
    expect(
      redactDiagnosticText('token="private value without a closing quote'),
    ).toBe('token=[redacted]')
  })

  it('preserves empty values and redacts empty quoted values', () => {
    expect(redactDiagnosticText('token=')).toBe('token=')
    expect(redactDiagnosticText('token=""')).toBe('token=[redacted]')
  })

  it('removes URL credentials, queries, and fragments', () => {
    expect(
      redactDiagnosticText(
        'Failed https://user:password@example.test/pi?token=secret#private and /pi?key=secret',
      ),
    ).toBe('Failed https://example.test/pi and /pi[redacted parameters]')
  })

  it('removes recognized credentials and authorization tokens', () => {
    const text = redactDiagnosticText(
      'Bearer abc.def.ghi password=secret "access_token": "private" api-key=hidden Basic dXNlcjpwYXNz',
    )
    for (const secret of [
      'abc.def.ghi',
      'secret',
      'private',
      'hidden',
      'dXNlcjpwYXNz',
    ]) {
      expect(text).not.toContain(secret)
    }
  })

  it('preserves useful error and build information', () => {
    const text =
      'Category: fews-pi\nStartup stage: Load configuration | HTTP 503\nMessage: Request timed out\nFEWS WebOC: 1.5.1'
    expect(redactDiagnosticText(text)).toBe(text)
  })
})
