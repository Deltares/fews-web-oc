import './assets/config-error.css'

;(function () {
  var marker = 'error.html'
  var legacyMarker = 'error.html'
  var path = window.location.pathname

  var markerIndex = path.indexOf(marker)
  if (markerIndex === -1) {
    markerIndex = path.indexOf(legacyMarker)
  }

  if (markerIndex === -1) {
    return
  }

  var appRoot = path.slice(0, markerIndex)
  if (!appRoot.endsWith('/')) {
    appRoot += '/'
  }

  var target = appRoot + window.location.search + window.location.hash
  window.history.replaceState(null, '', target)
})()
