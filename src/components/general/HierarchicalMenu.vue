<template>
  <TreeMenu
    v-if="type === 'tree'"
    v-model:active="active"
    :items="items"
    :open="open"
  />
  <ColumnMenu
    v-else-if="type === 'column'"
    v-model:active="active"
    v-model:open="open"
    :items="items"
  />
</template>

<script setup lang="ts">
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import TreeMenu from '@/components/general/TreeMenu.vue'
import { ColumnItem } from './ColumnItem'

interface Props {
  type: string
  items: ColumnItem[]
}
defineProps<Props>()

const open = defineModel<string[]>('open')
const active = defineModel<string>('active')
</script>
