import type { Layer } from '@deltares/fews-wms-requests'
import { nextTick, ref } from 'vue'
import { expect, test } from 'vitest'

import { useWmsEnsembles } from '.'

function layerWithEnsembles(
  ensembles: { ensembleId: string; ensembleMemberIds: string[] }[],
): Layer {
  return { ensembles } as Layer
}

const ensembleLayer = layerWithEnsembles([
  { ensembleId: 'ECMWF_ENS', ensembleMemberIds: ['0', '1', '2', '3'] },
])
const otherEnsembleLayer = layerWithEnsembles([
  { ensembleId: 'GFS_ENS', ensembleMemberIds: ['0', '1', '2'] },
])
const deterministicLayer = layerWithEnsembles([
  { ensembleId: 'main', ensembleMemberIds: ['0'] },
])

test('selects the first member of the first ensemble initially', () => {
  const { selection } = useWmsEnsembles(ensembleLayer)
  expect(selection.value).toEqual({
    ensembleId: 'ECMWF_ENS',
    ensembleMemberId: '0',
  })
})

test('removes duplicate member IDs', () => {
  const { ensembles } = useWmsEnsembles(
    layerWithEnsembles([
      {
        ensembleId: 'Gefs',
        ensembleMemberIds: ['2', '2', '1', '1', '10', '10'],
      },
    ]),
  )
  expect(ensembles.value).toEqual([
    { ensembleId: 'Gefs', ensembleMemberIds: ['1', '2', '10'] },
  ])
})

test('restores the selected member after switching to and from a deterministic layer', async () => {
  const layer = ref<Layer | undefined>(ensembleLayer)
  const { selection, canSelectEnsemble } = useWmsEnsembles(layer)
  selection.value = { ensembleId: 'ECMWF_ENS', ensembleMemberId: '2' }

  layer.value = deterministicLayer
  await nextTick()
  expect(canSelectEnsemble.value).toBe(false)
  expect(selection.value).toEqual({ ensembleId: 'main', ensembleMemberId: '0' })

  layer.value = ensembleLayer
  await nextTick()
  expect(selection.value).toEqual({
    ensembleId: 'ECMWF_ENS',
    ensembleMemberId: '2',
  })
})

test('restores the selected member after switching to and from a layer without ensembles', async () => {
  const layer = ref<Layer | undefined>(ensembleLayer)
  const { selection } = useWmsEnsembles(layer)
  selection.value = { ensembleId: 'ECMWF_ENS', ensembleMemberId: '3' }

  layer.value = layerWithEnsembles([])
  await nextTick()
  expect(selection.value).toBeNull()

  layer.value = ensembleLayer
  await nextTick()
  expect(selection.value?.ensembleMemberId).toBe('3')
})

test('remembers the selected member per ensemble', async () => {
  const layer = ref<Layer | undefined>(ensembleLayer)
  const { selection } = useWmsEnsembles(layer)
  selection.value = { ensembleId: 'ECMWF_ENS', ensembleMemberId: '2' }

  layer.value = otherEnsembleLayer
  await nextTick()
  expect(selection.value).toEqual({
    ensembleId: 'GFS_ENS',
    ensembleMemberId: '0',
  })
  selection.value = { ensembleId: 'GFS_ENS', ensembleMemberId: '1' }

  layer.value = ensembleLayer
  await nextTick()
  expect(selection.value?.ensembleMemberId).toBe('2')

  layer.value = otherEnsembleLayer
  await nextTick()
  expect(selection.value?.ensembleMemberId).toBe('1')
})
