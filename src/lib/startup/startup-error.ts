import { BASE_URL, CONFIG_ERROR_STORAGE_KEY } from './startup-constants.js'

export function logConfigLoadReason(configError: Error): void {
  if (configError instanceof SyntaxError) {
    console.error('Reason: Invalid JSON syntax in app-config.json')
    return
  }

  if (configError instanceof TypeError) {
    console.error('Reason: Network failure while loading app-config.json')
    return
  }

  if (configError.message.includes('Failed to load app-config.json')) {
    console.error(
      'Reason: Config file missing or server returned non-200 status',
    )
    return
  }

  if (
    configError.message.includes('Invalid app-config.json') ||
    configError.message.includes('Invalid JSON in app-config.json')
  ) {
    console.error('Reason: Invalid app-config.json content')
    return
  }

  console.error('Reason: Unknown startup error')
}

export function handleStartupError(err: unknown): void {
  const configError = err instanceof Error ? err : new Error(String(err))

  console.error('Config Load Error:', configError)
  if (configError.stack) {
    console.error('Config Load Error Stack:', configError.stack)
  }

  logConfigLoadReason(configError)

  const redirectDelayMs = import.meta.env.DEV ? 3000 : 1000
  console.error(`Redirecting to config-error page in ${redirectDelayMs} ms...`)

  sessionStorage.setItem(
    CONFIG_ERROR_STORAGE_KEY,
    configError.message || String(configError),
  )

  globalThis.setTimeout(() => {
    globalThis.location.replace(`${BASE_URL}error.html`)
  }, redirectDelayMs)
}
