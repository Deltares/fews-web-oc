import { defineComponent, h, onUnmounted, ref, watch, type PropType } from 'vue'
import { useTheme } from 'vuetify'
import { configManager } from '@/services/application-config'
import type {
  DynamicReportEdit,
  DynamicReportNode,
} from '@/lib/dynamic-report/nodes'
import DynamicReportContent from './DynamicReportContent.vue'
import TimeSeriesValueInput from './dynamic/TimeSeriesValueInput.vue'
import timeSeriesValueInputCss from './dynamic/timeSeriesValueInput.css?inline'
import reportHtml from '../../../tests/fixtures/dynamic-report/dynamic-report-desalination-plants.html?raw'

// Make the water level of the first location editable
const editableReportHtml = reportHtml
  .replace(
    '<td class="number">-0.699</td>',
    `<td class="number">
    <span data-input-type="number" data-time-series-index="0"
          data-time="2026-10-27T06:00:00Z">-0.699</span>
  </td>`,
  )
  // An unbalanced "}" should not close the scope of the report styles
  .replace(
    '</body>',
    '<style>} [data-testid="outside"] { color: rgb(255, 0, 0); }</style>\n</body>',
  )

const isolatedReportHtml = editableReportHtml
  .replace('<head>', '<head>\n<meta name="weboc-styling" content="isolated" />')
  .replace('css/DynamicReport.css', 'css/DynamicReportIsolated.css')

function createStory(html: string) {
  return defineComponent({
    props: {
      /** Switch the Vuetify theme while the story is mounted */
      theme: { type: String as PropType<'light' | 'dark'>, default: undefined },
    },
    setup(props) {
      configManager.update({
        VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews/`,
      })
      const lastEdit = ref<DynamicReportEdit>()

      const theme = useTheme()
      const initialTheme = theme.name.value
      watch(
        () => props.theme,
        (name) => theme.change(name ?? initialTheme),
        { immediate: true },
      )
      onUnmounted(() => theme.change(initialTheme))

      return () =>
        h('div', { 'data-testid': 'story' }, [
          // Checks that the report styles do not leak out of the report
          h('table', { class: 'document-file-table' }, [
            h('thead', [h('tr', [h('th', { 'data-testid': 'outside' }, 'x')])]),
          ]),
          h('input', {
            class: 'time-series-value-input',
            'data-testid': 'outside-input',
          }),
          h(
            DynamicReportContent,
            { html, nodeCss: timeSeriesValueInputCss },
            {
              node: ({ node }: { node: DynamicReportNode }) =>
                h(TimeSeriesValueInput, {
                  node,
                  onChange: (edit: DynamicReportEdit) => {
                    lastEdit.value = edit
                  },
                }),
            },
          ),
          h(
            'output',
            { 'data-testid': 'last-edit' },
            lastEdit.value ? JSON.stringify(lastEdit.value) : '',
          ),
        ])
    },
  })
}

// A fixed positioned overlay should stay inside the report
function withOverlay(html: string) {
  return html.replace(
    '</body>',
    `<div class="report-overlay" data-testid="overlay"></div>
<style>
  .report-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background-color: rgba(255, 0, 0, 0.2);
  }
</style>
</body>`,
  )
}

export const WebOc = createStory(editableReportHtml)
export const Isolated = createStory(isolatedReportHtml)
export const WebOcOverlay = createStory(withOverlay(editableReportHtml))
export const IsolatedOverlay = createStory(withOverlay(isolatedReportHtml))
