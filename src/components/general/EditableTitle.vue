<template>
  <div ref="container" class="title d-inline-block">
    <!-- View Mode -->
    <button
      v-if="!editing"
      type="button"
      class="title-trigger pa-1 rounded cursor-pointer border border-opacity-0"
      :class="{ 'border-opacity-100': isHovering }"
      @click="startEditing"
    >
      {{ model }}
      <v-icon
        icon="mdi-pencil"
        size="18"
        class="edit-icon pb-1 opacity-0"
        :class="{ 'opacity-100': isHovering }"
        aria-hidden="true"
      />
    </button>

    <!-- Edit Mode -->
    <div v-else ref="editBox" class="pa-1 border rounded">
      <input
        ref="editableInput"
        v-model="editableText"
        type="text"
        aria-label="Title"
        class="editable-content"
        @keydown.enter.prevent="saveEdit"
        @keydown.esc.prevent="cancelEdit"
        @blur="onBlur"
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
const editableInput = useTemplateRef('editableInput')

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

  if (!editableInput.value) return

  editableText.value = model.value
  editableInput.value.focus()
  editableInput.value.select()
}

function saveEdit() {
  const text = editableText.value.trim()
  model.value = text
  editableText.value = text
  editing.value = false
}

function cancelEdit() {
  editableText.value = model.value
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
.title-trigger {
  color: inherit;
  font: inherit;
  text-align: left;
  background: transparent;
  border-style: solid;
  border-width: 1px;
}

.edit-icon {
  opacity: 0.6;
  transition: opacity 0.2s;
}
.edit-icon:hover {
  opacity: 1;
}

.title {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.editable-content {
  min-width: 8ch;
  outline: none;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
}
</style>
