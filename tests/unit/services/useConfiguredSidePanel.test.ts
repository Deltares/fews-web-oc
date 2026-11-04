import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import type { SidePanelType } from '@/lib/sidepanel'
import { useConfiguredSidePanel } from '@/services/useConfiguredSidePanel'
import { useSidePanelStack } from '@/services/useSidePanelStack'

function setup({
  nodeId = 'node-1',
  configured = null,
  initialPanel,
  isReady = true,
  isPinned = false,
}: {
  nodeId?: string
  configured?: SidePanelType | null
  initialPanel?: SidePanelType
  isReady?: boolean
  isPinned?: boolean
} = {}) {
  const stack = useSidePanelStack(['runTask', 'share', 'logDisplay'])
  if (initialPanel) stack.open(initialPanel)

  const refs = {
    nodeId: ref(nodeId),
    configured: ref<SidePanelType | null>(configured),
    isReady: ref(isReady),
    isPinned: ref(isPinned),
  }

  useConfiguredSidePanel({
    nodeId: refs.nodeId,
    isReady: refs.isReady,
    configuredPanelType: refs.configured,
    isPinned: refs.isPinned,
    rootPanelType: stack.rootPanelType,
    open: stack.open,
    close: stack.close,
  })

  async function navigate(id: string, panel: SidePanelType | null) {
    refs.nodeId.value = id
    refs.configured.value = panel
    await nextTick()
  }

  return { ...stack, ...refs, navigate }
}

describe('useConfiguredSidePanel', () => {
  it('opens the configured panel', () => {
    const { rootPanelType } = setup({ configured: 'runTask' })
    expect(rootPanelType.value).toBe('runTask')
  })

  it('opens no panel when none is configured', () => {
    const { rootPanelType } = setup()
    expect(rootPanelType.value).toBeNull()
  })

  it('opens and closes the panel when navigating between nodes', async () => {
    const { rootPanelType, navigate } = setup()

    await navigate('node-2', 'runTask')
    expect(rootPanelType.value).toBe('runTask')

    await navigate('node-3', null)
    expect(rootPanelType.value).toBeNull()
  })

  it('switches to the panel configured for the next node', async () => {
    const { rootPanelType, navigate } = setup({ configured: 'runTask' })

    await navigate('node-2', 'share')
    expect(rootPanelType.value).toBe('share')
  })

  it('keeps a manually opened panel when the next node has no panel', async () => {
    const { rootPanelType, open, navigate } = setup()

    open('share')
    await navigate('node-2', null)

    expect(rootPanelType.value).toBe('share')
  })

  it('keeps a panel the user switched to when the next node has no panel', async () => {
    const { rootPanelType, open, navigate } = setup({ configured: 'runTask' })

    open('share')
    await nextTick()
    await navigate('node-2', null)

    expect(rootPanelType.value).toBe('share')
  })

  it('keeps a manually opened panel that was switched by a configured node', async () => {
    const { rootPanelType, open, navigate } = setup()

    open('share')
    await nextTick()

    await navigate('node-2', 'runTask')
    expect(rootPanelType.value).toBe('runTask')

    await navigate('node-3', null)
    expect(rootPanelType.value).toBe('runTask')
  })

  it('closes an automatically opened panel after switching between configured nodes', async () => {
    const { rootPanelType, navigate } = setup({ configured: 'runTask' })

    await navigate('node-2', 'share')
    expect(rootPanelType.value).toBe('share')

    await navigate('node-3', null)
    expect(rootPanelType.value).toBeNull()
  })

  it('does not reopen a closed panel within the same node', async () => {
    const { rootPanelType, close, isReady } = setup({ configured: 'runTask' })

    close()
    await nextTick()
    isReady.value = false
    await nextTick()
    isReady.value = true
    await nextTick()

    expect(rootPanelType.value).toBeNull()
  })

  it('reopens a closed panel when another node is opened', async () => {
    const { rootPanelType, close, navigate } = setup({ configured: 'runTask' })

    close()
    await nextTick()
    await navigate('node-2', 'runTask')

    expect(rootPanelType.value).toBe('runTask')
  })

  it('waits for the settings of the node to be loaded', async () => {
    const { rootPanelType, isReady, configured } = setup({ isReady: false })
    expect(rootPanelType.value).toBeNull()

    configured.value = 'runTask'
    isReady.value = true
    await nextTick()

    expect(rootPanelType.value).toBe('runTask')
  })

  it('does not reset the stack when the configured panel is already open', async () => {
    const { stack, push, navigate } = setup({ configured: 'runTask' })

    push('logDisplay')
    await navigate('node-2', 'runTask')

    expect(stack.value.map((panel) => panel.type)).toEqual([
      'runTask',
      'logDisplay',
    ])
  })

  it('ignores the configuration while pinned', async () => {
    const { rootPanelType, navigate } = setup({
      initialPanel: 'share',
      isPinned: true,
    })

    await navigate('node-2', 'runTask')
    expect(rootPanelType.value).toBe('share')

    await navigate('node-3', null)
    expect(rootPanelType.value).toBe('share')
  })

  it('closes an automatically opened panel on the next node after unpinning', async () => {
    const { rootPanelType, isPinned, navigate } = setup({
      configured: 'runTask',
    })

    isPinned.value = true
    await navigate('node-2', null)
    expect(rootPanelType.value).toBe('runTask')

    isPinned.value = false
    await navigate('node-3', null)
    expect(rootPanelType.value).toBeNull()
  })

  it('prefers a panel that is already open over the first configuration', async () => {
    const { rootPanelType, navigate } = setup({
      initialPanel: 'share',
      configured: 'runTask',
    })
    expect(rootPanelType.value).toBe('share')

    await navigate('node-2', 'runTask')
    expect(rootPanelType.value).toBe('runTask')
  })
})
