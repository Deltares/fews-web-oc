import { describe, expect, test } from 'vitest'
import {
  initialsFromUpperCaseName,
  initialsFromPreferredUserName,
} from './initials'

describe('initialsFromUpperCaseName', () => {
  test('returns first two uppercase characters', () => {
    expect(initialsFromUpperCaseName('John Doe')).toEqual('JD')
  })

  test('returns empty string when no uppercase characters are present', () => {
    expect(initialsFromUpperCaseName('john doe')).toEqual('')
  })

  test('returns one uppercase character when only one exists', () => {
    expect(initialsFromUpperCaseName('john Doe')).toEqual('D')
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
