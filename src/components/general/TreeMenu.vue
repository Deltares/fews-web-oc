<template>
  <v-list
    :opened="opened"
    open-strategy="multiple"
    density="compact"
    class="weboc-treemenu"
    :lines="false"
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
  open?: string[]
  active?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  open: () => {
    return []
  },
  active: '',
})

const emit = defineEmits(['update:open'])

const opened = computed((): string[] => {
  return props.open
})

const stack = useMenuItemsStack(
  () => props.items,
  () => props.active,
)

watch(
  stack,
  () => {
    const path = stack.value.map((item: ColumnItem) => item.id)
    emit('update:open', [...path, ...props.open])
  },
  { immediate: true },
)
</script>
