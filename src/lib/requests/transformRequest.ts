import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { usePermissionsStore } from '@/stores/permissions'

export interface CreateTransformRequestFnOptions {
  controller?: AbortController
  disablePermissionExcludes?: boolean
}

export function createTransformRequestFn(
  options?: CreateTransformRequestFnOptions,
) {
  return async (request: Request): Promise<Request> => {
    const additionalHeaders = await getRequestHeaders({
      disablePermissionExcludes: options?.disablePermissionExcludes,
    })
    const headers = mergeHeaders(request.headers, additionalHeaders)
    return new Request(request, {
      headers,
      signal: options?.controller?.signal,
    })
  }
}

export interface GetRequestHeadersOptions {
  disablePermissionExcludes?: boolean
}

export async function getRequestHeaders(
  options?: GetRequestHeadersOptions,
): Promise<Headers> {
  const authHeaders = await authenticationManager.getAuthorizationHeaders()
  if (options?.disablePermissionExcludes) {
    return authHeaders
  } else {
    const permissionsStore = usePermissionsStore()
    const permissionExcludeHeaders =
      await permissionsStore.getPermissionsExcludesHeader()
    return mergeHeaders(permissionExcludeHeaders, authHeaders)
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
