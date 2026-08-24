import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CapacitorConfig } from '@capacitor/cli'
// Type-only, so it is erased before the Capacitor CLI transpiles this file: the app
// side of that module imports Vuetify, which must not be pulled into a Node build.
// Sharing the type keeps the key names below checked against the app's own contract.
import type { ApplicationConfig } from './src/services/application-config/ApplicationConfig'

/**
 * Capacitor reads this file in Node at `cap sync` time, so the WebView origin has
 * to be decided during the build. That is at odds with the rest of the app, which
 * fetches app-config.json at runtime precisely so a deployment can be repointed
 * without rebuilding. To avoid a second place where the backend host is written
 * down, derive the origin from app-config.json instead of hardcoding it.
 *
 * Unlike the web app, the WebView has no origin to start from: the web app is
 * already loaded and reads window.location.origin, whereas something has to hand
 * the WebView its first URL. That is the one fact this file has to supply.
 *
 * Resolution order:
 *   1. CAPACITOR_SERVER_URL      — explicit override: a different host, a base path
 *                                  other than /, or a dev server for live reload
 *   2. VITE_FEWS_WEBSERVICES_URL — app-config.json, origin only, assuming the Web OC
 *                                  is served from the root of the FEWS host
 *
 * If neither resolves, `server` is left off entirely and the app falls back to the
 * assets bundled into the APK.
 *
 * Note this cannot use `configManager.getWithDefault()` the way the app does.
 * That reader only answers once `update()` has been called with the fetched
 * app-config.json, it resolves fallbacks through Vite's `import.meta.env`, and it
 * transitively needs `window` — none of which exist in this Node build step. The
 * file is read directly instead, and the shared type below keeps the keys honest.
 */

// The Capacitor CLI transpiles this file to CommonJS, so import.meta.url is not
// available here. The CLI always runs from the project root, so resolve from cwd.
const APP_CONFIG = resolve(process.cwd(), 'public/app-config.json')

function readAppConfig(): Partial<ApplicationConfig> {
  try {
    return JSON.parse(readFileSync(APP_CONFIG, 'utf-8'))
  } catch (error) {
    console.warn(`[capacitor.config] Could not read ${APP_CONFIG}: ${error}`)
    return {}
  }
}

function asUrl(value: unknown, key: string): URL | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    return new URL(value)
  } catch {
    console.warn(
      `[capacitor.config] Ignoring ${key}, not an absolute URL: ${value}`,
    )
    return undefined
  }
}

// Read once: both the app name and the server URL come from this file.
const appConfig = readAppConfig()

function resolveServerUrl(): string | undefined {
  const override = asUrl(
    process.env.CAPACITOR_SERVER_URL,
    'CAPACITOR_SERVER_URL',
  )
  if (override) return override.href

  // The FewsWebServices URL is a sibling of the app, not the app itself: take the
  // origin and assume the Web OC is deployed at the root of that host. A deployment
  // served from a base path (see BASE_URL in deltares.env) needs the override above.
  const fews = asUrl(
    appConfig.VITE_FEWS_WEBSERVICES_URL,
    'VITE_FEWS_WEBSERVICES_URL',
  )
  return fews ? `${fews.origin}/` : undefined
}

/**
 * Keeps the name in one place rather than repeating the literal here.
 *
 * Undefined when the key is absent, which leaves appName off the config entirely.
 *
 * Note this value is not what renames the installed app: the launcher label comes
 * from `app_name` in android/app/src/main/res/values/strings.xml, which the CLI
 * writes only during `cap add`. android/sync-app-name.mjs copies VITE_APP_NAME
 * there on every `npm run sync:android` to keep the two from drifting.
 */
function resolveAppName(): string | undefined {
  return appConfig.VITE_APP_NAME
}

const serverUrl = resolveServerUrl()
const appName = resolveAppName()

if (serverUrl) {
  console.log(`[capacitor.config] WebView will load ${serverUrl}`)
} else {
  console.warn(
    '[capacitor.config] No server URL resolved; falling back to the bundled web assets.',
  )
}

const config: CapacitorConfig = {
  appId: 'de.hydrotec.weboc',
  appName,
  webDir: 'dist',
  // Loading the deployed Web OC rather than the bundled assets keeps the WebView on
  // the real origin, so the OIDC redirect stays same-origin and Capacitor's local
  // asset server is out of the picture: it never resolved the
  // https://localhost/auth/callback deep path, which left the login stranded on
  // ERR_CONNECTION_REFUSED after Keycloak had already issued the code.
  // Note this makes the app require network access at startup.
  ...(serverUrl ? { server: { url: serverUrl } } : {}),
  android: {
    // The WebView origin is the resolved server URL above, so the OIDC redirect
    // URIs and the FEWS CORS configuration only need to allow that one origin.
    // No https://localhost entries are required for this setup.
    allowMixedContent: false,
  },
}

export default config
