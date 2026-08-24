import type { ApplicationConfig } from '../../services/application-config/ApplicationConfig.js'
import { BASE_URL } from './startup-constants.js'

export async function loadApplicationConfig(): Promise<
  Partial<ApplicationConfig>
> {
  const response = await fetch(`${BASE_URL}app-config.json`)
  if (!response.ok) {
    throw new Error(
      `Failed to load app-config.json (${response.status} ${response.statusText})`,
    )
  }

  // Only reject a content type that is present and wrong, which still catches a
  // server serving its SPA fallback (text/html) for a missing config. A missing
  // header is tolerated: Android WebView asset servers do not set one for .json,
  // and the JSON.parse below rejects non-JSON content anyway.
  const contentType = response.headers.get('Content-Type')
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `Invalid content type for app-config.json: expected application/json, got "${contentType}"`,
    )
  }

  const text = await response.text()
  try {
    return JSON.parse(text) as Partial<ApplicationConfig>
  } catch (err) {
    throw new Error(
      'Invalid JSON in app-config.json: ' +
        (err instanceof Error ? err.message : String(err)),
    )
  }
}
