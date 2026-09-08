import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import type {
  SidePanelProps,
  SidePanelRequest,
  SidePanelType,
} from '@/lib/sidepanel'

/**
 * A side panel that is currently open, with the props it was opened with.
 */
export interface OpenSidePanel {
  type: SidePanelType
  props: Record<string, unknown>
}

/**
 * Manages a stack of side panels, of which only the top-most one is visible.
 *
 * This allows a side panel to be temporarily overlaid by another panel, e.g.
 * opening the logs for a task run from the import status panel, without losing
 * the state of the panel below it.
 *
 * @param availableTypes types of the panels that are currently enabled; opening
 *   a panel that is not available is ignored.
 */
export function useSidePanelStack(
  availableTypes: MaybeRefOrGetter<SidePanelType[]>,
) {
  const stack = ref<OpenSidePanel[]>([])

  const activePanel = computed<OpenSidePanel | null>(
    () => stack.value.at(-1) ?? null,
  )
  const rootPanelType = computed<SidePanelType | null>(
    () => stack.value[0]?.type ?? null,
  )
  const canGoBack = computed<boolean>(() => stack.value.length > 1)

  function isAvailable(type: SidePanelType): boolean {
    return toValue(availableTypes).includes(type)
  }

  function open<T extends SidePanelType>(
    type: T,
    props: SidePanelProps[T] | Record<string, never> = {},
  ): void {
    if (!isAvailable(type)) return
    stack.value = [{ type, props }]
  }

  function push<T extends SidePanelType>(
    type: T,
    props: SidePanelProps[T] | Record<string, never> = {},
  ): void {
    if (!isAvailable(type)) return

    if (activePanel.value?.type === type) {
      // Do not stack the same panel twice; update its props instead.
      stack.value.splice(stack.value.length - 1, 1, { type, props })
      return
    }

    stack.value.push({ type, props })
  }

  function pushRequest(request: SidePanelRequest): void {
    push(request.type, request.props)
  }

  function pop(): void {
    stack.value.pop()
  }

  function close(): void {
    stack.value = []
  }

  return {
    stack,
    activePanel,
    rootPanelType,
    canGoBack,
    open,
    push,
    pushRequest,
    pop,
    close,
  }
}
