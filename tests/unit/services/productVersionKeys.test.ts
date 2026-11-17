import { describe, expect, it, vi } from 'vitest'
import type { ArchiveProduct } from '@/lib/products/documentDisplay'
import { getArchiveProducts } from '@/services/useProducts'

const getProductsMetaData = vi.hoisted(() =>
  vi.fn(async () => ({ productsMetadata: [] })),
)

vi.mock('@deltares/fews-pi-requests', () => ({
  PiArchiveWebserviceProvider: class {
    getProductsMetaData = getProductsMetaData
  },
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: vi.fn(),
}))
vi.mock('@/lib/products/local', () => ({
  removeRemoteFromLocalProductsMetaData: vi.fn(),
  getLocalProductsMetaData: () => [],
  combineProductsMetaData: () => [],
}))

describe('archive product version keys', () => {
  it.each([
    [undefined, ['productId']],
    [[], ['productId']],
    [
      ['areaId', 'sourceId'],
      ['productId', 'areaId', 'sourceId'],
    ],
  ])(
    'uses configured keys %j alongside productId',
    async (versionKeys, expected) => {
      const product: ArchiveProduct = {
        id: 'report',
        description: '',
        timeZero: '',
        version: '',
        versionKeys,
      }

      await getArchiveProducts('https://example.test', [product], {
        start: { days: -1 },
        end: { days: 1 },
      })

      expect(getProductsMetaData).toHaveBeenLastCalledWith(
        expect.objectContaining({
          versionKey: expected,
          attribute: { productId: 'report' },
        }),
      )
      expect(product.versionKeys).toEqual(versionKeys)
    },
  )
})
