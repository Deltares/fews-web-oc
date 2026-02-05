<template>
  <UnsavedChangesGuard
    ref="guard"
    :when="hasChanges"
    @confirm="showModal = true"
  />
  <ConfirmModal
    v-model="showModal"
    :title="t('common.unsavedChanges')"
    :message="t('common.unsavedChangesExitWarning')"
    @confirm="confirmLeave"
    @cancel="cancelLeave"
  />
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
    <v-btn icon="mdi-close" @click="onClose"></v-btn>
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
import UnsavedChangesGuard from '@/components/reports/UnsavedChangesGuard.vue'
import ConfirmModal from '@/components/reports/ConfirmModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const modelValue = defineModel<string>()

interface Emits {
  save: []
  close: []
  change: [isDirty: boolean]
}
const emit = defineEmits<Emits>()

const initialContent = ref('')
const extractedStyles = ref('')

// Initialize editor with HTML (excluding style tags)
const editor = useEditor({
  extensions,
  content: '', // Start empty, we'll set content after processing
})
const guard = ref<InstanceType<typeof UnsavedChangesGuard> | null>(null)

const showModal = ref<boolean>(false)

function confirmLeave(): void {
  showModal.value = false
  guard.value?.allowNavigation()
  emit('close')
}

function cancelLeave(): void {
  showModal.value = false
  guard.value?.cancelNavigation()
}

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
  let cleanedHtml = htmlContent
  let match
  do {
    match = false
    cleanedHtml = cleanedHtml.replace(styleRegex, (found, styleContent) => {
      css += styleContent
      match = true
      return ''
    })
  } while (match)

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

function onClose() {
  showModal.value = true
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
