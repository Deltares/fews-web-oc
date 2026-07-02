export type SystemTimeMode =
  | 'running'
  | 'running_fixed_interval'
  | 'offset_running'
  | 'offset_fixed_interval'
  | 'static'

export interface SystemTimeAnchor {
  baseSystemTimeMs: number
  fetchedAtClientMs: number
  mode: SystemTimeMode
  updateIntervalMs?: number
}

export interface SystemTimeSyncSnapshot {
  mode: SystemTimeMode
  updateIntervalMs?: number
  systemTime: Date
  fetchedAtClientMs: number
}

export function resolveSystemTimeAt(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): Date {
  const elapsed = Math.max(0, nowClientMs - anchor.fetchedAtClientMs)

  if (anchor.mode === 'static') {
    return new Date(anchor.baseSystemTimeMs)
  }

  const isFixedIntervalMode =
    anchor.mode === 'running_fixed_interval' ||
    anchor.mode === 'offset_fixed_interval'

  if (isFixedIntervalMode && anchor.updateIntervalMs && anchor.updateIntervalMs > 0) {
    const steps = Math.floor(elapsed / anchor.updateIntervalMs)
    return new Date(anchor.baseSystemTimeMs + steps * anchor.updateIntervalMs)
  }

  return new Date(anchor.baseSystemTimeMs + elapsed)
}

export function createSnapshot(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): SystemTimeSyncSnapshot {
  return {
    mode: anchor.mode,
    updateIntervalMs: anchor.updateIntervalMs,
    systemTime: resolveSystemTimeAt(anchor, nowClientMs),
    fetchedAtClientMs: anchor.fetchedAtClientMs,
  }
}
