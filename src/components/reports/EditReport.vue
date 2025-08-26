<template>
  <v-toolbar v-if="editor" density="compact">
    <TableMenu :editor="editor" ref="EditMenu" />
    <v-spacer />
    <v-btn
      variant="flat"
      @click="onSave"
      color="primary"
      class="text-none mr-5"
      :disabled="!hasChanges"
    >
      Save
    </v-btn>
    <v-tooltip text="Close editor">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-close" @click="onClose" />
      </template>
    </v-tooltip>
  </v-toolbar>
  <v-sheet theme="light" class="flex-1-1 h-100 position-relative">
    <editor-content :editor="editor" class="shadow-frame" />
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { extensions } from '@/components/reports/tiptap/extensions'
import TableMenu from '@/components/reports/tiptap/TableMenu.vue'
import { onBeforeRouteLeave } from 'vue-router'

const modelValue = defineModel<string>()

interface Emits {
  save: []
  close: []
}
const emit = defineEmits<Emits>()

const initialContent = ref('')
const extractedStyles = ref('')

// Convert hasChanges from ref to computed property
const hasChanges = computed(() => {
  return editor.value ? editor.value.getHTML() !== initialContent.value : false
})

// Extract CSS from the HTML content and remove style tags
function extractStylesFromHTML(htmlContent: string): {
  html: string
  css: string
} {
  if (!htmlContent) return { html: '', css: '' }
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let css = ''

  // Extract all style tags content
  const cleanedHtml = htmlContent.replace(styleRegex, (match, styleContent) => {
    css += styleContent
    return '' // Remove the style tag from HTML
  })

  return {
    html: cleanedHtml,
    css: css,
  }
}

// Apply extracted CSS to the document
function applyCssToEditor(css: string) {
  if (!css) return

  // Create or update style element for the editor
  let styleElement = document.getElementById('tiptap-injected-styles')
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'tiptap-injected-styles'
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = css
  extractedStyles.value = css
}

// Initialize editor with HTML (excluding style tags)
const editor = useEditor({
  extensions,
  content: '', // Start empty, we'll set content after processing
})

// Process modelValue when it changes
watch(
  () => modelValue.value,
  (newValue) => {
    if (!newValue) return
    const { html, css } = extractStylesFromHTML(newValue)
    if (editor.value && editor.value.getHTML() !== html) {
      editor.value.commands.setContent(modelValue.value || '')
      initialContent.value = editor.value.getHTML()
    }

    // Apply the extracted CSS
    applyCssToEditor(css)
  },
)

onMounted(() => {
  if (!modelValue.value) return
  const { html, css } = extractStylesFromHTML(modelValue.value)
  if (editor.value && editor.value.getHTML() !== html) {
    editor.value.commands.setContent(modelValue.value)
    initialContent.value = editor.value.getHTML()
  }
  applyCssToEditor(css)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  })
})

function onClose() {
  if (hasChanges.value) {
    const answer = window.confirm(
      'Do you really want to leave? you have unsaved changes!',
    )
    if (answer) {
      emit("close")
    }
  } else {
    emit("close")
  }
}

onBeforeRouteLeave(() => {
  if (!hasChanges.value) return true
  const answer = window.confirm(
    'Do you really want to leave? you have unsaved changes!',
  )
  if (!answer) return false
  return true
})

// Reattach the CSS to HTML when saving
async function onSave() {
  if (!editor.value) return

  let html = editor.value.getHTML()

  // Re-add the style tag if we have extracted styles
  if (extractedStyles.value) {
    html = `<style>${extractedStyles.value}</style>${html}`
  }
  // Strip <p> tags from table cells and headers
  // This is a workaround for the Tiptap editor, which adds <p> tags around table cell content
  html = html.replace(/<td([^>]*)><p>(.*?)<\/p><\/td>/g, '<td$1>$2</td>')
  html = html.replace(/<th([^>]*)><p>(.*?)<\/p><\/th>/g, '<th$1>$2</th>')
  modelValue.value = html
  emit('save')
  initialContent.value = editor.value.getHTML()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
  // Remove the injected styles
  const styleElement = document.getElementById('tiptap-injected-styles')
  if (styleElement) {
    styleElement.parentNode?.removeChild(styleElement)
  }
})
</script>

<style src="./tiptap/data.css" />
<style src="./tiptap/time.css" />

<style>
.tiptap {
  padding: 1em;
}
</style>
