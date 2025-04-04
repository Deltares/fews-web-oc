import { SearchMatch } from './types'

export function containsSubstring(haystack: string, needle: string): boolean {
  if (haystack === '') return false
  if (needle === '') return true
  const haystackToSearch = haystack.toLowerCase()
  const needleToSearch = needle.toLowerCase()
  return haystackToSearch.includes(needleToSearch)
}

export function findMatchingParts(
  haystack: string,
  needle: string,
): SearchMatch {
  if (needle === '' || !containsSubstring(haystack, needle)) {
    return {
      before: haystack,
      match: '',
      after: '',
    }
  }
  const haystackToSearch = haystack.toLowerCase()
  const needleToSearch = needle.toLowerCase()
  // We are certain that the needle is in the haystack, so this will never
  // return -1.
  const matchStartIndex = haystackToSearch.indexOf(needleToSearch)
  const matchEndIndex = matchStartIndex + needle.length

  return {
    before: haystack.slice(0, matchStartIndex),
    match: haystack.slice(matchStartIndex, matchEndIndex),
    after: haystack.slice(matchEndIndex),
  }
}
