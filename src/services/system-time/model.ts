export type SystemTimeBasis = 'client' | 'actual' | 'offset'
export type SystemTimeUpdatePattern = 'continuous' | 'step' | 'static'

export interface SystemTimeAnchor {
  baseSystemTimeMs: number
  fetchedAtClientMs: number
  timeBasis: SystemTimeBasis
  updatePattern: SystemTimeUpdatePattern
  updateIntervalMs?: number
}

export interface SystemTimeSyncSnapshot {
  timeBasis: SystemTimeBasis
  updatePattern: SystemTimeUpdatePattern
  updateIntervalMs?: number
  systemTime: Date
  fetchedAtClientMs: number
}

export function resolveSystemTimeAt(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): Date {
  const elapsed = Math.max(0, nowClientMs - anchor.fetchedAtClientMs)

  if (anchor.updatePattern === 'static') {
    return new Date(anchor.baseSystemTimeMs)
  }

  const isStepMode = anchor.updatePattern === 'step'

  if (isStepMode && anchor.updateIntervalMs && anchor.updateIntervalMs > 0) {
    const steps = Math.floor(elapsed / anchor.updateIntervalMs)
    return new Date(anchor.baseSystemTimeMs + steps * anchor.updateIntervalMs)
  }

  if (isStepMode) {
    return new Date(anchor.baseSystemTimeMs)
  }

  return new Date(anchor.baseSystemTimeMs + elapsed)
}

export function createSnapshot(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): SystemTimeSyncSnapshot {
  return {
    timeBasis: anchor.timeBasis,
    updatePattern: anchor.updatePattern,
    updateIntervalMs: anchor.updateIntervalMs,
    systemTime: resolveSystemTimeAt(anchor, nowClientMs),
    fetchedAtClientMs: anchor.fetchedAtClientMs,
  }
}
