export function sortEnsembleMemberIds(ensembleMemberIds: string[]): string[] {
  // Often, ensemble member IDs are just numbers. We check whether all IDs can
  // be parsed as a number and sort them by numeric value.
  const isAllNumeric = ensembleMemberIds.every((memberId) =>
    Number.isFinite(Number(memberId)),
  )
  if (isAllNumeric) {
    return ensembleMemberIds.toSorted((a, b) => Number(a) - Number(b))
  }
  // If not all IDs are numeric, we sort alphabetically.
  return ensembleMemberIds.toSorted((a, b) => a.localeCompare(b))
}
