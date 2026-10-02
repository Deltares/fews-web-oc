import './assets/config-error.css'

const ERROR_MESSAGE_STORAGE_KEY = 'configError'
const ERROR_MESSAGE_ELEMENT_ID = 'error-message'
const BASE_URL = import.meta.env.BASE_URL

function isErrorPagePath(pathname: string): boolean {
  return (
    pathname === `${BASE_URL}error` ||
    pathname.startsWith(`${BASE_URL}error/`)
  )
}

function isPageReload(): boolean {
  const navEntries = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[]
  return navEntries.length > 0 && navEntries[0].type === 'reload'
}

function renderStoredErrorMessage(): void {
  const errorMessage = sessionStorage.getItem(ERROR_MESSAGE_STORAGE_KEY)
  const errorDetailsElement = document.getElementById(ERROR_MESSAGE_ELEMENT_ID)
  if (errorMessage && errorDetailsElement) {
    errorDetailsElement.textContent = errorMessage
  }

  const appConfigLink = document.getElementById('app-config-link')
  if (appConfigLink instanceof HTMLAnchorElement) {
    appConfigLink.href = `${BASE_URL}app-config.json`
  }
}

function bootstrapErrorPage(): void {
  if (!isErrorPagePath(globalThis.location.pathname)) {
    return
  }

  if (isPageReload()) {
    globalThis.location.replace(BASE_URL)
    return
  }

  renderStoredErrorMessage()
}

bootstrapErrorPage()
