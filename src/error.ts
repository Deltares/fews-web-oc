import './assets/config-error.css'
;(function () {
  const marker = 'error.html'
  const path = window.location.pathname

  if (!path.includes(marker)) {
    return
  }

  const navEntries = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[]
  const isReload = navEntries.length > 0 && navEntries[0].type === 'reload'

  if (isReload) {
    window.location.replace(import.meta.env.BASE_URL)
    return
  }

  const errorMessage = sessionStorage.getItem('configError')
  if (errorMessage) {
    const errorDetailsElement = document.getElementById('error-message')
    if (errorDetailsElement) {
      errorDetailsElement.textContent = errorMessage
    }
  }
})()
