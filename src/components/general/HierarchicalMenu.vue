<template>
  <TreeMenu
    v-if="finalType === 'tree'"
    v-model:active="active"
    v-model:open="open"
    :items="items"
  />
  <ColumnMenu
    v-else-if="finalType === 'column'"
    v-model:active="active"
    v-model:open="open"
    :items="items"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import ColumnMenu from '@/components/general/ColumnMenu.vue'
import TreeMenu from '@/components/general/TreeMenu.vue'
import { ColumnItem } from './ColumnItem'

interface Props {
  type: string
  items: ColumnItem[]
}
const props = defineProps<Props>()

const active = defineModel<string>('active')
const open = ref<string[]>([])

const { mobile } = useDisplay()

const finalType = computed(() => {
  if (props.type === 'auto') {
    return mobile.value ? 'column' : 'tree'
  }
  return props.type
})
</script>
