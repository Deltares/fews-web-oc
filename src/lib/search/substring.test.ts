import { describe, expect, test } from 'vitest'

import { containsSubstring, findMatchingParts } from './substring'

describe('containsSubstring', () => {
  test('with substring at the start', () => {
    expect(containsSubstring('hello world', 'hello')).toEqual(true)
  })

  test('with substring at the end', () => {
    expect(containsSubstring('hello world', 'world')).toEqual(true)
  })

  test('with substring in the middle', () => {
    expect(containsSubstring('hello world', 'lo wo')).toEqual(true)
  })

  test('with substring not in the string', () => {
    expect(containsSubstring('hello world', 'foo')).toEqual(false)
  })

  test('with empty string', () => {
    expect(containsSubstring('', 'foo')).toEqual(false)
  })

  test('with empty substring', () => {
    expect(containsSubstring('hello world', '')).toEqual(true)
  })

  test('with empty string and substring', () => {
    expect(containsSubstring('', '')).toEqual(false)
  })

  test('with capital letters', () => {
    expect(containsSubstring('hello world', 'HELLO')).toEqual(true)
  })
})

describe('findMatchingParts', () => {
  test('with substring at the start', () => {
    expect(findMatchingParts('hello world', 'hello')).toEqual({
      before: '',
      match: 'hello',
      after: ' world',
    })
  })

  test('with substring at the end', () => {
    expect(findMatchingParts('hello world', 'world')).toEqual({
      before: 'hello ',
      match: 'world',
      after: '',
    })
  })

  test('with substring in the middle', () => {
    expect(findMatchingParts('hello world', 'lo wo')).toEqual({
      before: 'hel',
      match: 'lo wo',
      after: 'rld',
    })
  })

  test('with substring not in the string', () => {
    expect(findMatchingParts('hello world', 'foo')).toEqual({
      before: 'hello world',
      match: '',
      after: '',
    })
  })

  test('with empty string', () => {
    expect(findMatchingParts('', 'foo')).toEqual({
      before: '',
      match: '',
      after: '',
    })
  })

  test('with empty substring', () => {
    expect(findMatchingParts('hello world', '')).toEqual({
      before: 'hello world',
      match: '',
      after: '',
    })
  })

  test('with empty string and substring', () => {
    expect(findMatchingParts('', '')).toEqual({
      before: '',
      match: '',
      after: '',
    })
  })

  test('with capital letters', () => {
    expect(findMatchingParts('Hello World', 'lo wo')).toEqual({
      before: 'Hel',
      match: 'lo Wo',
      after: 'rld',
    })
  })
})
