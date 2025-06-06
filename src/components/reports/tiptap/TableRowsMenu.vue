<template>
  <v-btn-group>
    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="plain"
          size="small"
          @click="addRow(false)"
          :disabled="disableTableItems"
        >
          <v-icon>mdi-table-row-plus-before</v-icon>
        </v-btn>
      </template>
      <span>Insert row</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          size="small"
          variant="plain"
          @click="addRow(true)"
          :disabled="disableTableItems"
        >
          <v-icon>mdi-table-row-plus-after</v-icon>
        </v-btn>
      </template>
      <span>Add row</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          size="small"
          variant="plain"
          @click="deleteRow()"
          :disabled="disableTableItems"
        >
          <v-icon>mdi-table-row-remove</v-icon>
        </v-btn>
      </template>
      <span>Remove row</span>
    </v-tooltip>
  </v-btn-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

function addRow(after: boolean = false): void {
  const { state } = props.editor
  const { from, to } = state.selection
  const nodes: any[] = []

  state.doc.nodesBetween(from, to, (node, pos) => {
    nodes.push({ node, pos })
  })

  const tableRow = nodes
    .reverse()
    .find((item) => item.node.type.name === 'tableRow')
  if (!tableRow) return

  const { node, pos } = tableRow
  console.log(node)
  const cellNodes = node.content.content
  const insertPos = after ? pos + node.content.size : pos

  props.editor
    .chain()
    .insertContentAt(insertPos, {
      type: 'tableRow',
      attrs: node.attrs,
      content: cellNodes.map((c: any) => ({
        type: 'tableCell',
        attrs: c.attrs,
        content: [{ type: 'paragraph' }],
      })),
    })
    .run()
}

function deleteRow(): void {
  props.editor.chain().focus().deleteRow().run()
}

const disableTableItems = computed(() => {
  return !props.editor.can().deleteTable()
})
</script>

<style scoped>
.align-right {
  float: right;
}
</style>
