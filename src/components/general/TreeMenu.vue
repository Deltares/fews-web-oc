<template>
  <v-list :opened="opened" open-strategy="multiple" density="compact">
    <TreeMenuItem :items="props.items" :active="active"></TreeMenuItem>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ColumnItem } from './ColumnItem'
import TreeMenuItem from './TreeMenuItem.vue'

interface Props {
  items?: ColumnItem[]
  open?: string[]
  active?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  open: () => {
    return []
  },
  active: () => [],
})

const emit = defineEmits(['update:open'])

const opened = computed({
  get() {
    return props.open
  },
  set(value) {
    emit('update:open', value)
  },
})
</script>
