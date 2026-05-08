import './assets/config-error.css'
;(function () {
  const marker = 'error.html'
  const path = window.location.pathname

  if (!path.includes(marker)) {
    return
  }

  if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    window.location.replace(import.meta.env.BASE_URL)
    return
  }
})()
