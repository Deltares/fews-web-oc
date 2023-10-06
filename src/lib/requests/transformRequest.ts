import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'

export function transformRequestFn(controller?: AbortController) {
  return async (request: Request): Promise<Request> => {
    return Promise.resolve(
      authenticationManager.transformRequestAuth(request, controller?.signal),
    )
  }
}
