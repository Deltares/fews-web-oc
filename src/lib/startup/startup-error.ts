import {
  BASE_URL,
  CONFIG_ERROR_STORAGE_KEY,
  CONFIG_ERROR_SOURCE_STORAGE_KEY,
  CONFIG_ERROR_CONTEXT_STORAGE_KEY,
} from './startup-constants.js'

export type StartupErrorCategory =
  | 'application-config'
  | 'fews-pi'
  | 'authentication'
  | 'microfrontends'
  | 'unexpected'

export class StartupError extends Error {
  constructor(
    message: string,
    public readonly category: StartupErrorCategory,
    public readonly stage: string,
    cause?: unknown,
    public readonly status?: number,
  ) {
    super(message, { cause })
    this.name = 'StartupError'
  }
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return
  if ('status' in error && typeof error.status === 'number') return error.status
  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  )
    return error.response.status
}

export async function runStartupStage<T>(
  category: StartupErrorCategory,
  stage: string,
  action: () => T | Promise<T>,
): Promise<T> {
  try {
    return await action()
  } catch (cause) {
    if (cause instanceof StartupError) throw cause
    throw new StartupError(
      cause instanceof Error ? cause.message : String(cause),
      category,
      stage,
      cause,
      getHttpStatus(cause),
    )
  }
}

export class FewsConfigLoadError extends StartupError {
  constructor(cause: unknown, stage = 'Load FEWS WebOC configuration') {
    const detail = cause instanceof Error ? cause.message : String(cause)
    const status = getHttpStatus(cause)
    super(
      `Failed to load configuration from FEWS PI: ${detail}`,
      status === 401 || status === 403 ? 'authentication' : 'fews-pi',
      stage,
      cause,
      status,
    )
    this.name = 'FewsConfigLoadError'
  }
}

export function logConfigLoadReason(configError: Error): void {
  if (configError instanceof StartupError) {
    console.error(`Reason: ${configError.stage} (${configError.category})`)
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
  sessionStorage.setItem(
    CONFIG_ERROR_SOURCE_STORAGE_KEY,
    configError instanceof StartupError ? configError.category : 'unexpected',
  )
  sessionStorage.setItem(
    CONFIG_ERROR_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      category:
        configError instanceof StartupError
          ? configError.category
          : 'unexpected',
      stage:
        configError instanceof StartupError
          ? configError.stage
          : 'Application startup',
      message: configError.message,
      status:
        configError instanceof StartupError ? configError.status : undefined,
    }),
  )

  globalThis.setTimeout(() => {
    globalThis.location.replace(`${BASE_URL}error/`)
  }, redirectDelayMs)
}
