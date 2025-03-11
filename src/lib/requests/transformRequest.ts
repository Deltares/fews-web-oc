import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'

export function createTransformRequestFn(controller?: AbortController) {
  return async (request: Request): Promise<Request> => {
    return await authenticationManager.transformRequestAuth(
      request,
      controller?.signal,
    )
  }
}

export function mergeHeaders(headers1: Headers, headers2: Headers): Headers {
  const mergedHeaders = new Headers()
  headers1.forEach((value, key) => {
    mergedHeaders.set(key, value)
  })
  headers2.forEach((value, key) => {
    mergedHeaders.set(key, value)
  })
  return mergedHeaders
}
