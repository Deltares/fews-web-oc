import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import type { SidePanelType } from '@/lib/sidepanel'
import { useSidePanelStack } from '@/services/useSidePanelStack'

describe('useSidePanelStack', () => {
  it('ignores panels that are not available', () => {
    const { stack, open } = useSidePanelStack(['share'])
    open('sharedRequests')
    expect(stack.value).toEqual([])
  })

  it('closes a panel and the panels on top of it when it becomes unavailable', async () => {
    const availableTypes = ref<SidePanelType[]>([
      'share',
      'sharedRequests',
      'logDisplay',
    ])
    const { stack, open, push } = useSidePanelStack(availableTypes)

    open('share')
    push('sharedRequests')
    push('logDisplay')
    expect(stack.value.map((panel) => panel.type)).toEqual([
      'share',
      'sharedRequests',
      'logDisplay',
    ])

    availableTypes.value = ['share', 'logDisplay']
    await nextTick()

    expect(stack.value.map((panel) => panel.type)).toEqual(['share'])
  })

  it('keeps the stack when all open panels remain available', async () => {
    const availableTypes = ref<SidePanelType[]>(['share', 'sharedRequests'])
    const { stack, open } = useSidePanelStack(availableTypes)

    open('share')
    availableTypes.value = ['share']
    await nextTick()

    expect(stack.value.map((panel) => panel.type)).toEqual(['share'])
  })
})
