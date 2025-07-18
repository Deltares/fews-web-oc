export interface Serializer<T> {
  read: (raw: string) => T
  write: (value: T) => string
}

export function getJsonSerializer<T>(): Serializer<T> {
  return {
    read: (value) => JSON.parse(value),
    write: (value) => JSON.stringify(value),
  }
}

export function getDateTimeSerializer<T>(): Serializer<T> {
  return {
    read: (value) => JSON.parse(value, dateTimeReviver),
    write: (value) => JSON.stringify(value),
  }
}

function isIsoDate(str: string) {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)
}

const dateTimeReviver = (_: unknown, value: unknown) => {
  if (typeof value === 'string') {
    if (isIsoDate(value)) {
      return new Date(value)
    }
  }
  return value
}
