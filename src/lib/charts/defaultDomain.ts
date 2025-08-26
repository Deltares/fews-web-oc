export function isDefaultD3Domain([start, end]:
  | [number, number]
  | [Date, Date]): boolean {
  // Check if the provided range is a numeric range
  if (typeof start === 'number' && typeof end === 'number') {
    return isDefaultD3LinearScaleDomain([start, end])
  }

  // Check if the provided range is a date range
  if (start instanceof Date && end instanceof Date) {
    return isDefaultD3TimeScaleDomain([start, end])
  }

  // If neither, return false
  return false
}

// Checks if the provided numeric range is the default D3 linear scale domain
// See: https://d3js.org/d3-scale/linear#scaleLinear
export function isDefaultD3LinearScaleDomain([start, end]: [
  number,
  number,
]): boolean {
  return start === 0 && end === 1
}

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

export function isNumberDomain(
  domain: [number, number] | [Date, Date] | [undefined, undefined],
): domain is [number, number] {
  return typeof domain[0] === 'number' && typeof domain[1] === 'number'
}

export function isDateDomain(
  domain: [number, number] | [Date, Date],
): domain is [Date, Date] {
  return domain[0] instanceof Date && domain[1] instanceof Date
}
