<template>
  <v-list
    v-model:opened="open"
    open-strategy="multiple"
    density="comfortable"
    class="weboc-treemenu"
    :lines="false"
    data-test-id="topology-tree"
  >
    <TreeMenuItem :items="props.items" :active="active"></TreeMenuItem>
  </v-list>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ColumnItem } from './ColumnItem'
import TreeMenuItem from './TreeMenuItem.vue'
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

const stack = useMenuItemsStack(
  () => props.items,
  () => props.active,
)

const stackPath = computed(() => stack.value.map((item: ColumnItem) => item.id))

watch(
  stackPath,
  (newStack, oldStack) => {
    if (newStack.join() === oldStack?.join()) return

    open.value = [...new Set([...stackPath.value, ...open.value])]
  },
  { immediate: true },
)
</script>
