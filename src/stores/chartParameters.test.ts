import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test } from 'vitest'
import { useChartParametersStore } from './chartParameters'

beforeEach(() => {
  setActivePinia(createPinia())
})

test('collects parameters across active charts and removes unmounted displays', () => {
  const store = useChartParametersStore()
  const main = Symbol('main')
  const other = Symbol('other')
  store.setParameterIds(main, ['level', 'discharge'])
  store.setParameterIds(other, ['level', 'rain'])
  expect(store.parameterIds).toEqual(['level', 'discharge', 'rain'])
  store.setParameterIds(main, ['temperature'])
  expect(store.parameterIds).toEqual(['temperature', 'level', 'rain'])
  store.removeParameterIds(other)
  expect(store.parameterIds).toEqual(['temperature'])
  store.removeParameterIds(main)
  expect(store.parameterIds).toEqual([])
})
