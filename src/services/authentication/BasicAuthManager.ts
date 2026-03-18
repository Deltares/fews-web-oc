const CREDENTIALS_KEY = 'basicauth_credentials'
const USERNAME_KEY = 'basicauth_username'

export class BasicAuthManager {
  login(username: string, password: string): void {
    const encoded = btoa(`${username}:${password}`)
    sessionStorage.setItem(CREDENTIALS_KEY, encoded)
    sessionStorage.setItem(USERNAME_KEY, username)
  }

  logout(): void {
    sessionStorage.removeItem(CREDENTIALS_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(CREDENTIALS_KEY) !== null
  }

  getUsername(): string {
    return sessionStorage.getItem(USERNAME_KEY) ?? ''
  }

  getAuthorizationHeader(): string {
    const credentials = sessionStorage.getItem(CREDENTIALS_KEY)
    if (credentials) {
      return `Basic ${credentials}`
    }
    return ''
  }
}

export const basicAuthManager = new BasicAuthManager()
