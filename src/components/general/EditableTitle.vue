<template>
  <div ref="container" class="title d-inline-block">
    <!-- View Mode -->
    <div
      v-if="!editing"
      class="pa-1 rounded cursor-pointer border border-opacity-0"
      :class="{ 'border-opacity-100': isHovering }"
      @click="startEditing"
    >
      {{ model }}
      <v-icon
        icon="mdi-pencil"
        size="18"
        class="edit-icon pb-1 opacity-0"
        :class="{ 'opacity-100': isHovering }"
      />
    </div>

    <!-- Edit Mode -->
    <div v-else ref="editBox" class="pa-1 border rounded">
      <div
        ref="editableDiv"
        contenteditable="true"
        class="editable-content"
        @keydown.enter.prevent="saveEdit"
        @keydown.esc.prevent="cancelEdit"
        @blur="onBlur"
        tabindex="0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, useTemplateRef } from 'vue'
import { useElementHover } from '@vueuse/core'

const model = defineModel<string>({
  required: true,
})

const editing = ref(false)
const editableText = ref(model.value)

const container = useTemplateRef('container')
const editableDiv = useTemplateRef('editableDiv')

const isHovering = useElementHover(container)

watch(
  () => model.value,
  (val) => {
    if (!editing.value) editableText.value = val
  },
)

async function startEditing() {
  editing.value = true
  await nextTick()

  if (!editableDiv.value) return

  editableDiv.value.innerText = model.value
  editableDiv.value.focus()

  // Select all text in the editable div
  const range = document.createRange()
  range.selectNodeContents(editableDiv.value)
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function saveEdit() {
  if (editableDiv.value) {
    const text = editableDiv.value.innerText.trim()
    model.value = text
    editableText.value = text
  }
  editing.value = false
}

function cancelEdit() {
  if (editableDiv.value) {
    editableDiv.value.innerText = model.value
  }
  editing.value = false
}

// On blur, save the edit
function onBlur() {
  // Only save if still editing (sometimes blur may fire after cancel)
  if (editing.value) {
    saveEdit()
  }
}
</script>

<style scoped>
.edit-icon {
  opacity: 0.6;
  transition: opacity 0.2s;
}
.edit-icon:hover {
  opacity: 1;
}

.title {
  white-space: pre-wrap;
  word-break: break-word;
}

.editable-content {
  outline: none;
  min-height: 24px;
}
</style>
