import { describe, expect, test } from 'vitest'
import { initialsFromName, initialsFromPreferredUserName } from './initials'

describe('initialsFromName', () => {
  test('returns first two uppercase characters', () => {
    expect(initialsFromName('John Doe')).toEqual('JD')
  })

  test('returns empty string when no uppercase characters are present', () => {
    expect(initialsFromName('john doe')).toEqual('')
  })

  test('returns one uppercase character when only one exists', () => {
    expect(initialsFromName('john Doe')).toEqual('D')
  })
})

describe('initialsFromPreferredUserName', () => {
  test('returns empty string for empty input', () => {
    expect(initialsFromPreferredUserName('')).toEqual('')
  })

  test('uses first separator match for initials', () => {
    expect(initialsFromPreferredUserName('john.doe')).toEqual('jd')
  })

  test('supports underscore separator', () => {
    expect(initialsFromPreferredUserName('john_doe')).toEqual('jd')
  })

  test('falls back to first two characters when no separator exists', () => {
    expect(initialsFromPreferredUserName('johndoe')).toEqual('jo')
  })

  test('returns single character when input length is one', () => {
    expect(initialsFromPreferredUserName('j')).toEqual('j')
  })
})
