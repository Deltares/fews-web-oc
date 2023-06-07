/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeRelations(data: any, fields: string[]) {
  return {
      ...data,
      ...fields.reduce((prev: any, field: string) => ({
        ...prev,
        [field]: Array.isArray(data[field])
          ? data[field].map((x: any) => { return x.id })
          : data[field].id,
      }), {}),
    }
}

export function resolveRelations(data: any, fields: string[], rootGetters: any) {
  if (fields.length > 0) {
    const result = {
      ...data,
      ...fields.reduce((prev: any, field: string) => ({
        ...prev,
        [field]: Array.isArray(data[field]) ?
          data[field].map((x: any) => {
            const item = rootGetters[`${field}/find`](x)
            return item
          }) :
          rootGetters[`${field}/find`](data[field]),
      }), {}),
    }
    return result
  } else {
    return data
  }
}
