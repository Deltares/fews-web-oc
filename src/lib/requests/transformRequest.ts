import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { getPermissionExcludesHeader } from '@/services/usePermissionExcludes'

export function createTransformRequestFn(controller?: AbortController) {
  return (request: Request) => {
    const additionalHeaders = getRequestHeaders()
    const requestInit = {
      headers: mergeHeaders(request.headers, additionalHeaders),
      signal: controller?.signal,
    }
    const newRequest = new Request(request, requestInit)
    return Promise.resolve(newRequest)
  }
}

export function getRequestHeaders(): Headers {
  const permExcludeHeaders = getPermissionExcludesHeader()
  const authHeaders = authenticationManager.getAuthorizationHeaders()
  return mergeHeaders(permExcludeHeaders, authHeaders)
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
