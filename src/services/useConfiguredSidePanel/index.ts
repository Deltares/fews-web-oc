import { toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

import type { SidePanelType } from '@/lib/sidepanel'

export interface UseConfiguredSidePanelOptions {
  /** ID of the current topology node. */
  nodeId: MaybeRefOrGetter<string | undefined>
  /** Whether the settings of the current topology node have been loaded. */
  isReady: MaybeRefOrGetter<boolean>
  /** Panel configured for the current topology node, if any. */
  configuredPanelType: MaybeRefOrGetter<SidePanelType | null>
  /** Whether the configured panel should be ignored. */
  isPinned: MaybeRefOrGetter<boolean>
  /** Root panel that is currently open. */
  rootPanelType: Readonly<Ref<SidePanelType | null>>
  open: (type: SidePanelType) => void
  close: () => void
}

/**
 * Applies the side panel configured in the component settings when a topology
 * node is opened.
 *
 * The configuration is applied once per node, so a panel that the user closed
 * does not reopen on navigation within the node. Only panels that were opened
 * automatically from a closed state are closed when the next node has no panel
 * configured; a panel the user opened stays open, even after the configuration
 * of a node has switched it to another panel.
 *
 * A panel that is already open when this function is called, e.g. restored from
 * the route, takes precedence over the configuration of the first node.
 */
export function useConfiguredSidePanel(options: UseConfiguredSidePanelOptions) {
  const { nodeId, isReady, configuredPanelType, isPinned, rootPanelType } =
    options

  let appliedNodeId: string | undefined
  let keepCurrentPanel = rootPanelType.value !== null
  let autoOpenedType: SidePanelType | null = null

  function apply(): void {
    if (toValue(isPinned)) return

    const configuredType = toValue(configuredPanelType)
    if (configuredType === null) {
      if (autoOpenedType !== null && rootPanelType.value === autoOpenedType) {
        options.close()
      }
      autoOpenedType = null
    } else if (rootPanelType.value !== configuredType) {
      // Switching a panel the user opened does not make it automatic.
      const isUserPanel =
        rootPanelType.value !== null && autoOpenedType === null
      options.open(configuredType)
      autoOpenedType = isUserPanel ? null : configuredType
    }
  }

  // A panel that was switched or closed by the user is no longer automatic.
  watch(rootPanelType, (type) => {
    if (type !== autoOpenedType) autoOpenedType = null
  })

  watch(
    [() => toValue(nodeId), () => toValue(isReady)],
    ([id, ready]) => {
      if (!id || !ready || id === appliedNodeId) return
      appliedNodeId = id

      if (keepCurrentPanel) {
        keepCurrentPanel = false
        return
      }
      apply()
    },
    { immediate: true },
  )
}
