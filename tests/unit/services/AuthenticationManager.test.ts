import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User, type UserManagerSettings } from 'oidc-client-ts'
import { AuthenticationManager } from '../../../src/services/authentication/AuthenticationManager'
import {
  runStartupStage,
  StartupError,
} from '../../../src/lib/startup/startup-error'

const { getUser, addUserLoaded } = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<User | null>>(),
  addUserLoaded: vi.fn<(callback: (user: User) => void) => void>(),
}))

vi.mock('oidc-client-ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('oidc-client-ts')>()),
  UserManager: class {
    getUser = getUser
    events = { addUserLoaded }
  },
}))

vi.mock('../../../src/services/application-config/', () => ({
  configManager: { authenticationIsEnabled: true },
}))

const settings: UserManagerSettings = {
  authority: 'https://identity.example.test',
  client_id: 'weboc',
  redirect_uri: 'https://weboc.example.test/auth/callback',
}

function createUser(sub: string): User {
  return new User({
    access_token: 'test-access-token',
    token_type: 'Bearer',
    profile: {
      sub,
      iss: settings.authority,
      aud: settings.client_id,
      exp: 4_000_000_000,
      iat: 1_000_000_000,
    },
  })
}

describe('authentication initialization', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('allows startup to continue without waiting for interactive login', async () => {
    getUser.mockResolvedValue(null)
    const manager = new AuthenticationManager()

    await expect(
      runStartupStage('authentication', 'Initialize authentication', () =>
        manager.init(settings),
      ),
    ).resolves.toBeUndefined()
    expect(addUserLoaded).toHaveBeenCalledOnce()

    let resolved = false
    const pendingUser = manager.getUser().then((user) => {
      resolved = true
      return user
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(resolved).toBe(false)

    const user = createUser('interactive-user')
    addUserLoaded.mock.calls[0][0](user)
    await expect(pendingUser).resolves.toBe(user)
    await expect(manager.getUser()).resolves.toBe(user)
  })

  it('waits for the stored-user lookup before completing initialization', async () => {
    let finishLookup!: (user: User | null) => void
    getUser.mockReturnValue(
      new Promise((resolve) => {
        finishLookup = resolve
      }),
    )
    const manager = new AuthenticationManager()
    let initialized = false
    const initialization = manager.init(settings).then(() => {
      initialized = true
    })
    await Promise.resolve()
    expect(initialized).toBe(false)

    const user = createUser('stored-user')
    finishLookup(user)
    await initialization
    await expect(manager.getUser()).resolves.toBe(user)
  })

  it('preserves a loaded-user event received during the stored-user lookup', async () => {
    const manager = new AuthenticationManager()
    getUser.mockResolvedValue(null)
    const initialization = manager.init(settings)
    const user = createUser('event-user')
    addUserLoaded.mock.calls[0][0](user)

    await initialization
    await expect(manager.getUser()).resolves.toBe(user)
  })

  it('surfaces stored-user lookup failures as startup authentication errors', async () => {
    const cause = new Error('OIDC storage unavailable')
    getUser.mockRejectedValue(cause)
    const manager = new AuthenticationManager()

    const initialization = runStartupStage(
      'authentication',
      'Initialize authentication',
      () => manager.init(settings),
    )
    await expect(initialization).rejects.toBeInstanceOf(StartupError)
    await expect(initialization).rejects.toMatchObject({
      category: 'authentication',
      stage: 'Initialize authentication',
      cause,
    })
  })

  it('returns no user when authentication has not been initialized', async () => {
    await expect(new AuthenticationManager().getUser()).resolves.toBeNull()
    expect(getUser).not.toHaveBeenCalled()
  })
})
