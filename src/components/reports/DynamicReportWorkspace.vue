<template>
  <div class="d-flex flex-column h-100 w-100 dynamic-report-print-target">
    <v-toolbar
      v-if="html || $slots['toolbar-start']"
      density="compact"
      class="dynamic-report-no-print"
    >
      <slot name="toolbar-start" />
      <v-spacer />
      <v-btn v-if="html && !editing" :disabled="!canEdit" @click="startEditing">
        {{ t('dynamicReport.editReport') }}
      </v-btn>
      <template v-if="editing">
        <v-btn @click="showScreenshotDialog = true">
          {{ t('dynamicReport.addScreenshot') }}
        </v-btn>
        <v-btn @click="editing = false">
          {{ t('dynamicReport.previewReport') }}
        </v-btn>
      </template>
      <v-menu v-if="showExport && html">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            :disabled="!canEdit"
            prepend-icon="mdi-export-variant"
          >
            {{ t('dynamicReport.export') }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-file-code-outline"
            :title="t('dynamicReport.saveHtml')"
            @click="saveAsHtml"
          />
          <v-list-item
            prepend-icon="mdi-file-pdf-box"
            :title="t('dynamicReport.savePdf')"
            @click="saveAsPdf"
          />
        </v-list>
      </v-menu>
      <slot name="toolbar-end" />
    </v-toolbar>
    <v-alert
      v-if="editing || editedHtml"
      type="info"
      density="compact"
      class="dynamic-report-no-print"
    >
      {{ t('dynamicReport.unsavedReport') }}
    </v-alert>
    <DynamicReportContent
      v-if="html"
      ref="reportContent"
      :html="displayHtml"
      :style-html="html"
      :initial-editor-html="editedHtml || undefined"
      :editable="editing"
      :node-css="timeSeriesValueInputCss"
      class="flex-1-1"
      @update="onDocumentUpdate"
    >
      <template #node="{ node }">
        <TimeSeriesValueInput :node="node" @change="onEdit" />
      </template>
    </DynamicReportContent>
    <v-alert v-if="screenshotError" type="error">{{ screenshotError }}</v-alert>
    <slot v-if="!html" name="empty" />
    <NodeScreenshotDialog
      v-if="editing"
      v-model="showScreenshotDialog"
      :settings="settings"
      :initial-node-id="initialNodeId"
      @capture="onScreenshot"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { type DynamicReportEdit, getEditKey } from '@/lib/dynamic-report/nodes'
import { sanitizeDynamicReport } from '@/lib/dynamic-report/sanitize'
import { getDynamicReportFileName } from '@/lib/download/downloadDynamicReport'
import { clickDownloadBlob } from '@/lib/download/downloadFiles'
import DynamicReportContent from './DynamicReportContent.vue'
import TimeSeriesValueInput from './dynamic/TimeSeriesValueInput.vue'
import NodeScreenshotDialog from './dynamic/NodeScreenshotDialog.vue'
import timeSeriesValueInputCss from './dynamic/timeSeriesValueInput.css?inline'

interface Props {
  html: string
  displayId?: string
  locationId?: string
  time?: string
  initialNodeId?: string
  settings: ComponentSettings
  canEdit: boolean
  showExport?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const edits = ref(new Map<string, DynamicReportEdit>())
const editing = ref(false)
const editedHtml = ref('')
const showScreenshotDialog = ref(false)
const screenshotError = ref('')
const reportContent = ref<InstanceType<typeof DynamicReportContent>>()

function buildReportHtml(): string {
  if (!editedHtml.value) return props.html
  const document = new DOMParser().parseFromString(props.html, 'text/html')
  document.body.replaceChildren(
    sanitizeDynamicReport(editedHtml.value).fragment,
  )
  return document.documentElement.outerHTML
}

const displayHtml = computed(() =>
  editing.value ? props.html : buildReportHtml(),
)

let reportVersion = 0
watch(
  [
    () => props.html,
    () => props.displayId,
    () => props.locationId,
    () => props.time,
  ],
  () => {
    reportVersion++
    edits.value.clear()
    editedHtml.value = ''
    editing.value = false
    showScreenshotDialog.value = false
    screenshotError.value = ''
  },
  { flush: 'sync' },
)

function startEditing() {
  const content = document.createElement('div')
  content.appendChild(
    sanitizeDynamicReport(editedHtml.value || props.html).fragment,
  )
  content
    .querySelectorAll<HTMLElement>('[data-input-type]')
    .forEach((element) => {
      const { timeSeriesIndex, time } = element.dataset
      if (!timeSeriesIndex || !time) return
      const edit = edits.value.get(getEditKey({ timeSeriesIndex, time }))
      if (edit) element.textContent = edit.value
    })
  editedHtml.value = content.innerHTML
  editing.value = true
}

function onDocumentUpdate(html: string) {
  if (!editing.value) return
  editedHtml.value = html
  edits.value.clear()
  const content = document.createElement('div')
  content.appendChild(sanitizeDynamicReport(html).fragment)
  content
    .querySelectorAll<HTMLElement>('[data-input-type]')
    .forEach((element) => {
      const { timeSeriesIndex, time } = element.dataset
      if (!timeSeriesIndex || !time) return
      const edit = {
        timeSeriesIndex,
        time,
        value: element.textContent?.trim() ?? '',
      }
      edits.value.set(getEditKey(edit), edit)
    })
}

async function onScreenshot(image: Blob, label: string) {
  const version = reportVersion
  screenshotError.value = ''
  try {
    if (!reportContent.value) throw new Error('The report editor is not ready')
    await reportContent.value.insertScreenshot(image, label)
  } catch (cause) {
    console.error('Failed to insert screenshot into dynamic report', cause)
    if (version === reportVersion) {
      screenshotError.value = t('dynamicReport.screenshotInsertFailed')
    }
  }
}

function onEdit(edit: DynamicReportEdit) {
  edits.value.set(getEditKey(edit), edit)
}

function saveAsHtml() {
  const fileName = `${getDynamicReportFileName(props)}.html`
  clickDownloadBlob(
    new Blob([buildReportHtml()], { type: 'text/html' }),
    fileName,
  )
}

const printingClass = 'dynamic-report-printing'

function onAfterPrint() {
  document.body.classList.remove(printingClass)
}

function saveAsPdf() {
  document.body.classList.add(printingClass)
  window.addEventListener('afterprint', onAfterPrint, { once: true })
  window.print()
}
</script>

<style>
@media print {
  body.dynamic-report-printing * {
    visibility: hidden;
  }

  body.dynamic-report-printing .dynamic-report-print-target,
  body.dynamic-report-printing .dynamic-report-print-target * {
    visibility: visible;
  }

  body.dynamic-report-printing .dynamic-report-print-target {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto !important;
    overflow: visible !important;
    background: white;
  }

  body.dynamic-report-printing .dynamic-report-no-print {
    display: none !important;
  }

  body.dynamic-report-printing .dynamic-report-root {
    contain: none !important;
    height: auto !important;
    overflow: visible !important;
  }
}
</style>
