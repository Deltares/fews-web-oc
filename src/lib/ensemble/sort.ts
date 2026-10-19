export function sortEnsembleMemberIds(ensembleMemberIds: string[]): string[] {
  // Often, ensemble member IDs are just numbers. We check whether all IDs can
  // be parsed as a number and sort them by numeric value.
  const numericIds = ensembleMemberIds.map((id) => Number(id))
  const isAllNumeric = numericIds.every((numericId) => isFinite(numericId))
  if (isAllNumeric) {
    return numericIds.sort((a, b) => a - b).map((id) => id.toString())
  }
  // If not all IDs are numeric, we sort alphabetically.
  return ensembleMemberIds.toSorted()
}
