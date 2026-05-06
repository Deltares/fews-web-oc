export function getBrushDomain(
  start: Date | undefined,
  end: Date | undefined,
  fullChartDomain: [Date, Date] | undefined,
): [Date, Date] {
  if (start && end) {
    if (!fullChartDomain) return [start, end]
    // Ensure the brush domain always includes the full domain of the chart
    // If the brush domain is smaller than the chart domain, it can lead to issues with zooming and panning in the chart
    return [
      fullChartDomain[0] < start ? fullChartDomain[0] : start,
      fullChartDomain[1] > end ? fullChartDomain[1] : end,
    ]
  } else {
    return getDefaultBrushDomain()
  }
}

function getDefaultBrushDomain(): [Date, Date] {
  const now = new Date()

  // now - 2 years
  const startDate = new Date(now)
  startDate.setFullYear(startDate.getFullYear() - 2)

  // now + 2 months
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 2)

  return [startDate, endDate]
}
