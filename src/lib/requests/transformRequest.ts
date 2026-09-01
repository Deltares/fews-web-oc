import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { getPermissionExcludesHeader } from '@/services/usePermissionExcludes'

export function createTransformRequestFn(controller?: AbortController) {
  return async (request: Request): Promise<Request> => {
    const additionalHeaders = await getRequestHeaders()
    const headers = mergeHeaders(request.headers, additionalHeaders)
    return new Request(request, {
      headers,
      signal: controller?.signal,
    })
  }
}

export async function getRequestHeaders(): Promise<Headers> {
  const permExcludeHeaders = getPermissionExcludesHeader()
  const authHeaders = await authenticationManager.getAuthorizationHeaders()
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
