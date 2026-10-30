<template>
  <v-virtual-scroll
    ref="scroller"
    :items="rows"
    item-key="key"
    height="100%"
    class="weboc-treemenu"
    data-test-id="topology-tree"
  >
    <template #default="{ item: row }">
      <TreeMenuRow
        :item="row.item"
        :depth="row.depth"
        :active="props.active"
        :open="row.open"
        :show-divider="row.showDivider"
        @toggle="toggle(row.item.id)"
      />
    </template>
  </v-virtual-scroll>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ColumnItem } from './ColumnItem'
import TreeMenuRow from './TreeMenuRow.vue'
import { useMenuItemsStack } from '@/services/useMenuItemsStack'

interface Props {
  items?: ColumnItem[]
  active?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  active: '',
})

const open = defineModel<string[]>('open', { default: () => [] })

interface TreeRow {
  key: string
  item: ColumnItem
  depth: number
  open: boolean
  showDivider: boolean
}

const stack = useMenuItemsStack(
  () => props.items,
  () => props.active,
)

const stackPath = computed(() => stack.value.map((item: ColumnItem) => item.id))

// Flatten only the expanded part of the tree, so the virtual scroller can
// render a window of rows regardless of the total number of nodes.
const rows = computed<TreeRow[]>(() => {
  const openIds = new Set(open.value)
  const result: TreeRow[] = []

  function walk(items: ColumnItem[], depth: number) {
    for (const item of items) {
      const hasChildren = (item.children?.length ?? 0) > 0
      const isOpen = hasChildren && openIds.has(item.id)
      result.push({
        key: item.id,
        item,
        depth,
        open: isOpen,
        showDivider: false,
      })
      if (isOpen) {
        const children = item.children ?? []
        walk(children, depth + 1)
        if (children.some((c) => c.children?.length)) {
          result.push({
            key: `${item.id}::divider`,
            item: { id: `${item.id}::divider`, name: '' },
            depth: depth + 1,
            open: false,
            showDivider: true,
          })
        }
      }
    }
  }
  walk(props.items, 0)
  return result
})

function toggle(id: string) {
  open.value = open.value.includes(id)
    ? open.value.filter((openId) => openId !== id)
    : [...open.value, id]
}

watch(
  stackPath,
  (newStack, oldStack) => {
    if (newStack.join() === oldStack?.join()) return

    // Avoid replacing the array when nothing changes, to prevent a re-render.
    const missing = stackPath.value.filter((id) => !open.value.includes(id))
    if (missing.length > 0) open.value = [...open.value, ...missing]
    scrollToActive()
  },
  { immediate: true },
)

const scroller = ref<{
  $el: HTMLElement
  scrollToIndex: (index: number) => void
} | null>(null)

async function scrollToActive() {
  await nextTick()
  // Already rendered (e.g. the user clicked it), so no need to scroll.
  if (scroller.value?.$el?.querySelector('.v-list-item--active')) return
  const index = rows.value.findIndex((row) => row.item.id === props.active)
  if (index >= 0) scroller.value?.scrollToIndex(index)
}
</script>

<style scoped>
/* Rows are wider than the rail (also while it expands); clip them instead of
   scrolling horizontally. Titles are truncated with an ellipsis anyway. */
.weboc-treemenu {
  overflow-x: hidden;
}
</style>
