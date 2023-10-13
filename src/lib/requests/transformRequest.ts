import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'

export function createTransformRequestFn(controller?: AbortController) {
  return async (request: Request): Promise<Request> => {
    return Promise.resolve(
      authenticationManager.transformRequestAuth(request, controller?.signal),
    )
  }
}
