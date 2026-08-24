/**
 * Copies VITE_APP_NAME from public/app-config.json into the Android string
 * resources that carry the app's visible name.
 *
 * The Capacitor CLI cannot do this: it writes strings.xml only during `cap add`,
 * and then only by substituting its own 'My App' placeholder, so `cap sync` leaves
 * the launcher label frozen at whatever was there first. Without this step the name
 * lives in two places and drifts.
 *
 * Run as part of `npm run sync:android`, after `cap sync`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolved from this file rather than the working directory, so the script works
// whichever directory it is invoked from. Plain ESM here, so import.meta is
// available — unlike capacitor.config.ts, which the Capacitor CLI transpiles to CJS.
const ANDROID_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(ANDROID_DIR, '..')

const APP_CONFIG = resolve(PROJECT_ROOT, 'public/app-config.json')
const STRINGS_XML = resolve(ANDROID_DIR, 'app/src/main/res/values/strings.xml')

/** String resources that hold the user-visible app name. */
const NAME_KEYS = ['app_name', 'title_activity_main']

const PREFIX = '[sync-app-name]'

/**
 * Escapes a value for an Android string resource, matching what the Capacitor CLI
 * does in android/common.js so both paths treat a name the same way.
 */
function escapeForAndroid(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
}

function readAppName() {
  let raw
  try {
    raw = readFileSync(APP_CONFIG, 'utf-8')
  } catch (error) {
    console.warn(`${PREFIX} Could not read ${APP_CONFIG}: ${error.message}`)
    return undefined
  }

  let config
  try {
    config = JSON.parse(raw)
  } catch (error) {
    console.warn(`${PREFIX} ${APP_CONFIG} is not valid JSON: ${error.message}`)
    return undefined
  }

  const name = config.VITE_APP_NAME
  if (typeof name !== 'string' || name.trim() === '') {
    console.warn(
      `${PREFIX} VITE_APP_NAME is unset or empty; leaving names as-is.`,
    )
    return undefined
  }
  return name.trim()
}

const appName = readAppName()
// A missing name is not a build failure: the existing strings.xml is still valid.
if (appName === undefined) process.exit(0)

let xml
try {
  xml = readFileSync(STRINGS_XML, 'utf-8')
} catch (error) {
  console.error(`${PREFIX} Could not read ${STRINGS_XML}: ${error.message}`)
  process.exit(1)
}

const escaped = escapeForAndroid(appName)
let updated = xml

for (const key of NAME_KEYS) {
  // Matched and rewritten in place rather than re-serialising the document, so the
  // rest of the file (comments, attribute quoting, other resources) is untouched.
  const pattern = new RegExp(
    `(<string\\s+name="${key}"\\s*>)([^<]*)(</string>)`,
  )
  if (!pattern.test(updated)) {
    console.warn(`${PREFIX} No <string name="${key}"> in strings.xml; skipped.`)
    continue
  }
  updated = updated.replace(pattern, `$1${escaped}$3`)
}

if (updated === xml) {
  console.log(`${PREFIX} App name already "${appName}"; strings.xml unchanged.`)
  process.exit(0)
}

// Only written when something actually changed, so Gradle does not see a new mtime
// and redo the resource tasks on every build.
writeFileSync(STRINGS_XML, updated, 'utf-8')
console.log(`${PREFIX} Set ${NAME_KEYS.join(' and ')} to "${appName}".`)
