<template>
  <v-list
    v-model:opened="open"
    open-strategy="multiple"
    density="comfortable"
    class="weboc-treemenu"
    :lines="false"
  >
    <TreeMenuItem :items="props.items" :active="active"></TreeMenuItem>
  </v-list>
</template>

<script setup lang="ts">
import { watch } from 'vue'
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

watch(
  stack,
  () => {
    const path = stack.value.map((item: ColumnItem) => item.id)
    open.value = [...new Set([...path, ...open.value])]
  },
  { immediate: true },
)
</script>
