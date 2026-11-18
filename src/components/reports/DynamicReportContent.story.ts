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
import governorateReport from '../../../tests/fixtures/dynamic-report/DynamicReportGovernoratePerLocationTemplate.html?raw'
import districtReport from '../../../tests/fixtures/dynamic-report/DynamicReportDistrictInundationPerLocationTemplate.html?raw'

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

// Reports are isolated by default
const webocReportHtml = editableReportHtml.replace(
  '<head>',
  '<head>\n<meta name="fews-dynamic-report-styling" content="weboc" />',
)

const isolatedReportHtml = editableReportHtml
  .replace(
    '<head>',
    '<head>\n<meta name="fews-dynamic-report-styling" content="isolated" />',
  )
  .replace('css/DynamicReport.css', 'css/DynamicReportIsolated.css')

// The report style sheets are resolved against the FEWS static resources
function configureFewsWebServices() {
  configManager.update({
    VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews/`,
  })
}

function createStory(html: string) {
  return defineComponent({
    props: {
      /** Switch the Vuetify theme while the story is mounted */
      theme: { type: String as PropType<'light' | 'dark'>, default: undefined },
    },
    setup(props) {
      configureFewsWebServices()
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

export const WebOc = createStory(webocReportHtml)
export const Isolated = createStory(isolatedReportHtml)
export const WebOcOverlay = createStory(withOverlay(webocReportHtml))
export const IsolatedOverlay = createStory(withOverlay(isolatedReportHtml))

function createTableEditingStory(html: string) {
  return defineComponent({
    setup() {
      configureFewsWebServices()
      const editing = ref(false)
      const editedHtml = ref('')
      return () =>
        h('div', [
          h(
            'button',
            { onClick: () => (editing.value = !editing.value) },
            editing.value ? 'Apply edits' : 'Edit',
          ),
          h(DynamicReportContent, {
            html: editing.value || !editedHtml.value ? html : editedHtml.value,
            styleHtml: html,
            editable: editing.value,
            initialEditorHtml: editedHtml.value || undefined,
            onUpdate: (value: string) => (editedHtml.value = value),
          }),
        ])
    },
  })
}

export const GovernorateTableEditing =
  createTableEditingStory(governorateReport)
export const DistrictTableEditing = createTableEditingStory(districtReport)

const readonlyReportHtml = `<body>
  <p id="intro">Editable introduction</p>
  <div id="fixed" data-readonly="true">
    <h2>Fixed report information</h2>
    <p>Protected forecast: <strong>High</strong></p>
    <p><span data-input-type="number" data-time-series-index="0"
      data-time="2026-10-27T06:00:00Z">12.3</span></p>
  </div>
  <p id="commentary">Editable commentary</p>
</body>`

export const ReadonlyEditing = createTableEditingStory(readonlyReportHtml)
export const ReadonlyWebOcEditing = createTableEditingStory(
  `<head><meta name="fews-dynamic-report-styling" content="weboc"></head>${readonlyReportHtml}`,
)
