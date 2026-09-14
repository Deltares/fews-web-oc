export interface SystemTimeAnchor {
  baseSystemTimeMs: number
  fetchedAtClientMs: number
}

export interface SystemTimeSyncSnapshot {
  systemTime: Date
  fetchedAtClientMs: number
}

export function resolveSystemTimeAt(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): Date {
  const elapsed = Math.max(0, nowClientMs - anchor.fetchedAtClientMs)
  return new Date(anchor.baseSystemTimeMs + elapsed)
}

export function createSnapshot(
  anchor: SystemTimeAnchor,
  nowClientMs: number,
): SystemTimeSyncSnapshot {
  return {
    systemTime: resolveSystemTimeAt(anchor, nowClientMs),
    fetchedAtClientMs: anchor.fetchedAtClientMs,
  }
}
