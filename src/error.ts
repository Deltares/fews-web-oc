import './assets/config-error.css'
import { version as packageVersion } from '../package.json'
import { redactDiagnosticText } from './lib/startup/diagnostics.js'
import {
  CONFIG_ERROR_STORAGE_KEY,
  CONFIG_ERROR_SOURCE_STORAGE_KEY,
  CONFIG_ERROR_CONTEXT_STORAGE_KEY,
} from './lib/startup/startup-constants.js'

const ERROR_MESSAGE_ELEMENT_ID = 'error-message'
const BASE_URL = import.meta.env.BASE_URL
const commitHash = __GIT_TAG__ ? '' : __GIT_HASH__
const buildDate = new Date(__BUILD_DATE__).toISOString()

function isErrorPagePath(pathname: string): boolean {
  return (
    pathname === `${BASE_URL}error` || pathname.startsWith(`${BASE_URL}error/`)
  )
}

const errorCategories = {
  'application-config': {
    title: 'Application configuration unavailable',
    subtitle: 'Web OC could not load or apply its runtime configuration.',
  },
  'fews-pi': {
    title: 'Cannot connect to FEWS Web Services',
    subtitle:
      'Web OC could not load its configuration from FEWS PI Web Services. The service may be unavailable or unreachable.',
  },
  authentication: {
    title: 'Unable to access FEWS Web Services',
    subtitle: 'Authentication or access to FEWS could not be established.',
  },
  microfrontends: {
    title: 'Unable to initialize application modules',
    subtitle: 'Web OC could not initialize the configured application modules.',
  },
  unexpected: {
    title: 'Web OC could not start',
    subtitle:
      'An unexpected error interrupted startup. Try again or contact your administrator.',
  },
}

function renderDeploymentChecks(): void {
  const source = sessionStorage.getItem(CONFIG_ERROR_SOURCE_STORAGE_KEY)
  const category =
    source && Object.hasOwn(errorCategories, source)
      ? (source as keyof typeof errorCategories)
      : 'unexpected'
  const content = errorCategories[category]
  const title = document.getElementById('error-title')
  if (title) title.textContent = content.title
  document.title = `${content.title} - Delft-FEWS WebOC`
  const subtitle = document.getElementById('error-subtitle')
  if (subtitle) subtitle.textContent = content.subtitle
  for (const name of Object.keys(errorCategories)) {
    const checks = document.getElementById(`${name}-checks`)
    if (checks) checks.hidden = name !== category
  }

  const storedContext = sessionStorage.getItem(CONFIG_ERROR_CONTEXT_STORAGE_KEY)
  if (!storedContext) return
  try {
    const context: unknown = JSON.parse(storedContext)
    if (
      typeof context !== 'object' ||
      context === null ||
      !('stage' in context) ||
      typeof context.stage !== 'string'
    ) {
      throw new Error('Invalid startup error context')
    }
    const element = document.getElementById('error-context')
    if (element) {
      const status =
        'status' in context && typeof context.status === 'number'
          ? ` | HTTP ${context.status}`
          : ''
      element.textContent = `Startup stage: ${context.stage}${status}`
      element.hidden = false
    }
  } catch (error) {
    console.error('Could not read startup error context:', error)
  }
}

function renderStoredErrorMessage(): void {
  const errorMessage = sessionStorage.getItem(CONFIG_ERROR_STORAGE_KEY)
  const errorDetailsElement = document.getElementById(ERROR_MESSAGE_ELEMENT_ID)
  if (errorMessage && errorDetailsElement) {
    errorDetailsElement.textContent = errorMessage
  }

  renderDeploymentChecks()

  const appConfigLink = document.getElementById('app-config-link')
  if (appConfigLink instanceof HTMLAnchorElement) {
    appConfigLink.href = `${BASE_URL}app-config.json`
  }
  const retryLink = document.getElementById('retry-link')
  if (retryLink instanceof HTMLAnchorElement) retryLink.href = BASE_URL

  const versionElement = document.getElementById('weboc-version')
  if (versionElement) {
    versionElement.textContent = packageVersion
  }

  if (commitHash !== '') {
    const commitHashElement = document.getElementById('weboc-commit-hash')
    if (commitHashElement) {
      commitHashElement.textContent = commitHash
      commitHashElement.hidden = false
    }

    const buildDateElement = document.getElementById('weboc-build-date')
    if (buildDateElement) {
      buildDateElement.textContent = buildDate
      buildDateElement.hidden = false
    }
  }
}

function bootstrapErrorPage(): void {
  if (!isErrorPagePath(globalThis.location.pathname)) {
    return
  }

  renderStoredErrorMessage()
  document
    .getElementById('copy-diagnostics')
    ?.addEventListener('click', copyDiagnostics)
}

async function copyDiagnostics(): Promise<void> {
  const feedback = document.getElementById('copy-feedback')
  const source = sessionStorage.getItem(CONFIG_ERROR_SOURCE_STORAGE_KEY)
  const category =
    source && Object.hasOwn(errorCategories, source) ? source : 'unexpected'
  const diagnostics = [
    `Category: ${category}`,
    document.getElementById('error-context')?.textContent ?? '',
    `Message: ${document.getElementById('error-message')?.textContent?.trim() ?? ''}`,
    `FEWS WebOC: ${packageVersion}`,
    ...(commitHash
      ? [`Commit: ${commitHash}`, `Build date: ${buildDate}`]
      : []),
  ].join('\n')
  try {
    await navigator.clipboard.writeText(redactDiagnosticText(diagnostics))
    if (feedback)
      feedback.textContent =
        'Diagnostic details copied. Review them before sharing.'
  } catch (error) {
    console.error('Could not copy diagnostic details:', error)
    if (feedback)
      feedback.textContent =
        'Could not copy diagnostic details. Check browser clipboard permissions and try again.'
  }
}

bootstrapErrorPage()
