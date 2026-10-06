import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User, type UserManagerSettings } from 'oidc-client-ts'
import { AuthenticationManager } from './AuthenticationManager'
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig'

const mocks = vi.hoisted(() => ({
  construct: vi.fn(),
  getUser: vi.fn<() => Promise<User | null>>(),
  signinSilent: vi.fn<() => Promise<User | null>>(),
  addUserLoaded: vi.fn<(callback: (user: User) => void) => void>(),
  configManager: {
    authenticationIsEnabled: true,
    get: vi.fn(),
  },
}))

vi.mock('oidc-client-ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('oidc-client-ts')>()),
  UserManager: class {
    constructor(settings: UserManagerSettings) {
      mocks.construct(settings)
    }

    events = { addUserLoaded: mocks.addUserLoaded }
    getUser = mocks.getUser
    signinSilent = mocks.signinSilent
  },
}))

vi.mock('../application-config/', () => ({
  configManager: mocks.configManager,
}))

const settings: UserManagerSettings = {
  authority: 'https://identity.example.test',
  client_id: 'test-client',
  redirect_uri: 'https://app.example.test/login',
}

function createUser(accessToken = 'test-token', expired = false): User {
  return new User({
    access_token: accessToken,
    token_type: 'Bearer',
    profile: {
      sub: 'test-user',
      iss: settings.authority,
      aud: settings.client_id,
      exp: 0,
      iat: 0,
    },
    expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getUser.mockResolvedValue(null)
  mocks.configManager.authenticationIsEnabled = true
  mocks.configManager.get.mockReturnValue(RequestHeaderAuthorization.BEARER)
})

describe('AuthenticationManager initialization', () => {
  it('returns null when authentication has not been initialized', async () => {
    const manager = new AuthenticationManager()

    await expect(manager.getUser()).resolves.toBeNull()
    expect(mocks.getUser).not.toHaveBeenCalled()
  })

  it('loads the stored user without changing the synchronous init API', async () => {
    const user = createUser()
    mocks.getUser.mockResolvedValue(user)
    const manager = new AuthenticationManager()

    expect(manager.init(settings)).toBeUndefined()

    await expect(manager.getUser()).resolves.toBe(user)
    expect(mocks.construct).toHaveBeenCalledWith(settings)
    expect(mocks.getUser).toHaveBeenCalledOnce()
  })

  it('waits for a user-loaded event when no stored user exists', async () => {
    const manager = new AuthenticationManager()
    manager.init(settings)
    const resolved = vi.fn()
    const pendingUser = manager.getUser().then(resolved)

    await Promise.resolve()
    await Promise.resolve()
    expect(resolved).not.toHaveBeenCalled()

    const user = createUser()
    mocks.addUserLoaded.mock.calls[0][0](user)
    await pendingUser

    expect(resolved).toHaveBeenCalledWith(user)
  })

  it('preserves a user-loaded event arriving before the stored-user request completes', async () => {
    let resolveStoredUser!: (user: User | null) => void
    mocks.getUser.mockReturnValue(
      new Promise((resolve) => {
        resolveStoredUser = resolve
      }),
    )
    const manager = new AuthenticationManager()
    manager.init(settings)
    const pendingUser = manager.getUser()
    const user = createUser()

    mocks.addUserLoaded.mock.calls[0][0](user)
    resolveStoredUser(null)

    await expect(pendingUser).resolves.toBe(user)
  })

  it('keeps updating the user after initialization', async () => {
    mocks.getUser.mockResolvedValue(createUser())
    const manager = new AuthenticationManager()
    manager.init(settings)
    await manager.getUser()
    const updatedUser = createUser('updated-token')

    mocks.addUserLoaded.mock.calls[0][0](updatedUser)

    await expect(manager.getUser()).resolves.toBe(updatedUser)
  })

  it('propagates a rejected stored-user request', async () => {
    const error = new Error('Stored-user request failed')
    mocks.getUser.mockRejectedValue(error)
    const manager = new AuthenticationManager()
    manager.init(settings)

    await expect(manager.getUser()).rejects.toBe(error)
  })

  it('propagates a synchronous UserManager construction failure', async () => {
    const error = new Error('UserManager construction failed')
    mocks.construct.mockImplementation(() => {
      throw error
    })
    const manager = new AuthenticationManager()

    expect(() => manager.init(settings)).not.toThrow()
    await expect(manager.getUser()).rejects.toBe(error)
  })
})

describe('AuthenticationManager authorization headers', () => {
  it('returns empty headers without loading a token when authentication is disabled', async () => {
    mocks.configManager.authenticationIsEnabled = false
    const manager = new AuthenticationManager()
    const getAccessToken = vi.spyOn(manager, 'getAccessToken')

    expect([...(await manager.getAuthorizationHeaders())]).toEqual([])
    expect(getAccessToken).not.toHaveBeenCalled()
  })

  it('returns empty headers without loading a token for non-Bearer authorization', async () => {
    mocks.configManager.get.mockReturnValue(undefined)
    const manager = new AuthenticationManager()
    const getAccessToken = vi.spyOn(manager, 'getAccessToken')

    expect([...(await manager.getAuthorizationHeaders())]).toEqual([])
    expect(getAccessToken).not.toHaveBeenCalled()
  })

  it('returns a Bearer header using the stored access token', async () => {
    mocks.getUser.mockResolvedValue(createUser())
    const manager = new AuthenticationManager()
    manager.init(settings)

    const headers = await manager.getAuthorizationHeaders()

    expect([...headers]).toEqual([['authorization', 'Bearer test-token']])
    expect(mocks.signinSilent).not.toHaveBeenCalled()
  })

  it('uses the renewed token when the stored user has expired', async () => {
    mocks.getUser.mockResolvedValue(createUser('expired-token', true))
    mocks.signinSilent.mockResolvedValue(createUser('renewed-token'))
    const manager = new AuthenticationManager()
    manager.init(settings)

    const headers = await manager.getAuthorizationHeaders()

    expect(headers.get('Authorization')).toBe('Bearer renewed-token')
    expect(mocks.signinSilent).toHaveBeenCalledOnce()
  })

  it('propagates token-loading failures instead of returning empty headers', async () => {
    const error = new Error('Token request failed')
    mocks.getUser.mockRejectedValue(error)
    const manager = new AuthenticationManager()
    manager.init(settings)

    await expect(manager.getAuthorizationHeaders()).rejects.toBe(error)
  })
})
