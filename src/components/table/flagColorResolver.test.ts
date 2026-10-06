import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveCSSVariable } from '@/lib/utils/resolveCSSVariable'
import { createFlagColorResolver } from './flagColorResolver'

vi.mock('@/lib/utils/resolveCSSVariable', () => ({
  resolveCSSVariable: vi.fn(),
}))

describe('createFlagColorResolver', () => {
  beforeEach(() => {
    vi.mocked(resolveCSSVariable).mockReset()
  })

  it('resolves each distinct flag property only once', () => {
    vi.mocked(resolveCSSVariable).mockImplementation((color) =>
      color === 'var(--flag-reliable-color)' ? ' none ' : '#ffff00',
    )
    const resolve = createFlagColorResolver()

    for (let cell = 0; cell < 1000; cell++) {
      expect(resolve('var(--flag-reliable-color)')).toBe('none')
      expect(resolve('var(--flag-unreliable-color)')).toBe('#ffff00')
    }

    expect(resolveCSSVariable).toHaveBeenCalledTimes(2)
  })

  it('caches empty values too', () => {
    vi.mocked(resolveCSSVariable).mockReturnValue('')
    const resolve = createFlagColorResolver()

    expect(resolve('var(--flag-missing-color)')).toBe('')
    expect(resolve('var(--flag-missing-color)')).toBe('')
    expect(resolveCSSVariable).toHaveBeenCalledTimes(1)
  })

  it('uses independent caches for new tables or themes', () => {
    vi.mocked(resolveCSSVariable).mockReturnValue('none')
    const initialResolver = createFlagColorResolver()
    expect(initialResolver('var(--flag-reliable-color)')).toBe('none')

    vi.mocked(resolveCSSVariable).mockReturnValue('#ffffff')
    const nextResolver = createFlagColorResolver()
    expect(nextResolver('var(--flag-reliable-color)')).toBe('#ffffff')
    expect(initialResolver('var(--flag-reliable-color)')).toBe('none')
    expect(resolveCSSVariable).toHaveBeenCalledTimes(2)
  })
})