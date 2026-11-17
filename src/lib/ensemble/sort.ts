// Whether an ensemble member ID is a whole number, e.g. '12' or '-1'. Unlike
// Number(), this rejects e.g. '', ' ', '0x10' and '1e3'.
export function isWholeNumberMemberId(memberId: string): boolean {
  return /^-?\d+$/.test(memberId)
}

export function sortEnsembleMemberIds(ensembleMemberIds: string[]): string[] {
  // Often, ensemble member IDs are just numbers. We check whether all IDs are
  // whole numbers and sort them by numeric value.
  const isAllNumeric = ensembleMemberIds.every(isWholeNumberMemberId)
  if (isAllNumeric) {
    // Sort IDs with the same value, e.g. '1' and '01', alphabetically so the
    // order is deterministic.
    return ensembleMemberIds.toSorted(
      (a, b) =>
        Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.localeCompare(b),
    )
  }
  // If not all IDs are numeric, we sort alphabetically.
  return ensembleMemberIds.toSorted((a, b) => a.localeCompare(b))
}
