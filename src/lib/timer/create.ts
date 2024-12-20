import { Timer } from './types'

export function createTimer(
  callback: () => void,
  intervalSeconds: number,
  immediate: boolean,
): Timer {
  // Evaluate callback immediately, if so requested.
  if (immediate) {
    callback()
  }

  const createInterval = () => setInterval(callback, intervalSeconds * 1000)
  let id = createInterval()

  // Intervals are paused when a browser tab/window is inactive, so we add a
  // listener to the window focus event to check whether a refresh is overdue
  // if the window becomes active again.
  let lastUpdatedTimestamp: number = Date.now()
  const onFocus = () => {
    const now = Date.now()
    if (now - lastUpdatedTimestamp > intervalSeconds * 1000) {
      // Call callback and update last updated time.
      callback()
      lastUpdatedTimestamp = now
      // Reset interval so it starts counting from now, otherwise we may
      // update too often.
      clearInterval(id)
      id = createInterval()
    }
  }
  window.addEventListener('focus', onFocus)

  // Create function to deactivate the current timer. It cannot be reactivated,
  // only by creating a new timer.
  const deactivate = () => {
    clearInterval(id)
    window.removeEventListener('focus', onFocus)
  }

  return {
    deactivate,
  }
}
