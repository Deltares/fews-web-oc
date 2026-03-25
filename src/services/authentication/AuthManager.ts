import { mergeHeaders } from '@/lib/requests/transformRequest'

export interface AuthUser {
  name: string
  preferredUsername: string
  email?: string
  roles?: string[]
}

export interface AuthManager {
  init(): Promise<void>
  isAuthenticated(): Promise<boolean>
  login(options?: {
    username?: string
    password?: string
    redirectPath?: string
  }): Promise<void>
  logout(): Promise<void>
  getUser(): Promise<AuthUser | null>
  getAuthorizationHeaders(): Headers
  transformRequestAuth(request: Request, signal?: AbortSignal): Request
  onUserLoaded(callback: () => void): void
}

export function transformRequestWithAuth(
  authManager: AuthManager,
  request: Request,
  signal?: AbortSignal,
): Request {
  const requestAuthHeaders = authManager.getAuthorizationHeaders()
  const requestInit = {
    headers: mergeHeaders(request.headers, requestAuthHeaders),
    signal: signal,
  }
  return new Request(request, requestInit)
}
