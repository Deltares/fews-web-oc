import { defineComponent, h, ref } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { dynamicReportExtensions } from './dynamicReportExtensions'

export const Editable = defineComponent({
  setup() {
    const output = ref('')
    const editor = useEditor({
      extensions: dynamicReportExtensions,
      content:
        '<p><span class="report-value" data-input-type="number" data-time-series-index="0" data-time="2026-10-27T06:00:00Z">12.3</span></p>',
      onUpdate: ({ editor }) => {
        output.value = editor.getHTML()
      },
    })

    return () =>
      h('div', [
        h(EditorContent, { editor: editor.value }),
        h(
          'button',
          {
            onClick: () => editor.value?.commands.undo(),
          },
          'Undo',
        ),
        h('output', { 'data-testid': 'editor-html' }, output.value),
      ])
  },
})
