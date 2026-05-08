import './assets/config-error.css'

;(function () {
  var marker = 'config-error.html'
  var path = window.location.pathname

  if (path.indexOf(marker) === -1) {
    return
  }

  var appRoot = path.slice(0, path.indexOf(marker))
  if (!appRoot.endsWith('/')) {
    appRoot += '/'
  }

  var target = appRoot + window.location.search + window.location.hash
  window.history.replaceState(null, '', target)
})()
