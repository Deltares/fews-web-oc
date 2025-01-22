/**
 * Combine two URLs into a single URL.
 * @param url1 - The first URL.
 * @param url2 - The second URL.
 * @returns The combined URL.
 * @example
 * combineUrls('http://example.com', 'api') // 'http://example.com/api'
 * combineUrls('http://example.com/', '/api') // 'http://example.com/api'
 * combineUrls('/dashboard/', '/api') // '/dashboard/api'
 */
export function combineUrls(url1: string, url2: string): string {
  return `${url1.replace(/\/+$/, '')}/${url2.replace(/^\/+/, '')}`
}
