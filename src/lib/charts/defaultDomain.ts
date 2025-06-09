// Checks if the provided date range is the default D3 time scale domain
// See: https://d3js.org/d3-scale/time#scaleTime
export function isDefaultD3TimeScaleDomain([start, end]: [
  Date,
  Date,
]): boolean {
  return (
    start.getFullYear() === 2000 &&
    start.getMonth() === 0 &&
    start.getDate() === 1 &&
    end.getFullYear() === 2000 &&
    end.getMonth() === 0 &&
    end.getDate() === 2
  )
}
