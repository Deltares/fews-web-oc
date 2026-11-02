// Formats an identifier as a human-readable label by replacing dashes and
// underscores by spaces, e.g. 'ECMWF_ENS-high_res' becomes 'ECMWF ENS high res'.
export function toLabel(id: string): string {
  return id
    .split(/[\s_-]+/)
    .filter((word) => word !== '')
    .join(' ')
}
