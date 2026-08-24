// Runs the Gradle wrapper in the generated Capacitor Android project.
//
// The wrapper scripts cannot be invoked portably from an npm script: `gradlew`
// does not resolve on Windows machines that set NoDefaultCurrentDirectoryInExePath,
// and `./gradlew` is not valid in cmd.exe. This picks the right wrapper per
// platform so `npm run apk:debug` behaves the same everywhere.
//
// Usage: node android/gradle.mjs assembleDebug

import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolved from this file rather than the working directory, so the script works
// whichever directory it is invoked from.
const isWindows = process.platform === 'win32'
const androidDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(androidDir, '..')
const appConfigPath = join(projectRoot, 'public/app-config.json')
const wrapper = resolve(androidDir, isWindows ? 'gradlew.bat' : 'gradlew')

/**
 * Reads the configured SDK path from public/app-config.json.
 *
 * Note that file is deployed and served to browsers, so a path here is public and
 * is shared with everyone who checks out the repo. android/local.properties is
 * gitignored for exactly that reason; prefer ANDROID_HOME or a local .env if the
 * path should stay on this machine.
 */
function configuredSdkDir() {
  if (!existsSync(appConfigPath)) return undefined
  try {
    const value = JSON.parse(readFileSync(appConfigPath, 'utf-8')).VITE_SDK_DIR
    if (typeof value !== 'string' || value.trim() === '') return undefined
    return value.trim()
  } catch (error) {
    console.warn(`[gradle] Could not read ${appConfigPath}: ${error.message}`)
    return undefined
  }
}

/**
 * Ensures android/local.properties points at the SDK.
 *
 * A configured VITE_SDK_DIR wins and is copied on every run, so app-config.json stays
 * the source of truth. Otherwise the SDK is autodetected, which matters because
 * local.properties is gitignored and so absent after a fresh clone — Gradle then
 * fails with 'SDK location not found' and nothing in the repo can supply it.
 */
function ensureSdkLocation() {
  const localProperties = join(androidDir, 'local.properties')
  const configured = configuredSdkDir()

  const candidates = configured
    ? [configured]
    : [
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        isWindows && process.env.LOCALAPPDATA
          ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
          : undefined,
        process.platform === 'darwin'
          ? join(homedir(), 'Library', 'Android', 'sdk')
          : undefined,
        join(homedir(), 'Android', 'Sdk'),
      ].filter(Boolean)

  // Without a configured path, an existing file is left alone: it may hold a
  // deliberate choice that autodetection would trample.
  if (!configured && existsSync(localProperties)) return

  const sdkDir = candidates.find((candidate) => existsSync(candidate))
  if (!sdkDir) {
    if (configured) {
      console.error(
        `[gradle] VITE_SDK_DIR in public/app-config.json does not exist: ${configured}`,
      )
    } else {
      console.error(
        'No Android SDK found. Set VITE_SDK_DIR in public/app-config.json or\n' +
          'ANDROID_HOME, or create android/local.properties with a line like\n' +
          'sdk.dir=C:/path/to/Android/Sdk (forward slashes: a backslash is an\n' +
          'escape character in a .properties file).',
      )
    }
    process.exit(1)
  }

  // Backslashes would be read as escapes, so normalise to forward slashes.
  const contents = `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`
  const current = existsSync(localProperties)
    ? readFileSync(localProperties, 'utf-8')
    : undefined
  if (current === contents) return

  writeFileSync(localProperties, contents)
  console.log(
    `[gradle] Wrote android/local.properties -> ${sdkDir}` +
      (configured ? ' (from app-config.json)' : ''),
  )
}

ensureSdkLocation()

// Node refuses to spawn .bat files without a shell, so run the wrapper through
// cmd.exe on Windows and quote the path in case it contains spaces.
const child = spawn(
  isWindows ? `"${wrapper}"` : wrapper,
  process.argv.slice(2),
  {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWindows,
  },
)

child.on('error', (error) => {
  console.error(`Failed to run ${wrapper}: ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 1)))
