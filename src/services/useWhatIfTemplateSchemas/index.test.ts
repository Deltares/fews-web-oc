import { effectScope, type EffectScope } from 'vue'
import { afterEach, expect, test, vi } from 'vitest'
import type { WhatIfTemplate } from '@deltares/fews-pi-requests'
import { useWhatIfTemplateSchemas } from './index'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (file: string) => file,
}))

const scopes: EffectScope[] = []

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.unstubAllGlobals()
})

test('treats missing schema files as optional', async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 404 }))
  vi.stubGlobal('fetch', fetchMock)

  const scope = effectScope()
  scopes.push(scope)
  const schemas = scope.run(() =>
    useWhatIfTemplateSchemas({
      id: 'template',
      properties: [],
    } as unknown as WhatIfTemplate),
  )!

  await vi.waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(schemas.jsonSchema.value).toEqual({
      type: 'object',
      properties: {},
      required: [],
    })
  })
  expect(schemas.uiSchema.value).toBeUndefined()
})