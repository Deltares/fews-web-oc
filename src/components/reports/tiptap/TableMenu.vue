<template>
  <BaseMenu :editor="props.editor" ref="baseMenu"></BaseMenu>
  <TableRowsMenu :editor="props.editor" ref="tableRowsMenu"></TableRowsMenu>
</template>

<script setup lang="ts">
import BaseMenu from './BaseMenu.vue'
import TableRowsMenu from './TableRowsMenu.vue'
import { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()
</script>
