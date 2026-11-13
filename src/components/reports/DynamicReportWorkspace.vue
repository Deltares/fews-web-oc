<template>
  <div class="d-flex flex-column h-100 w-100 dynamic-report-print-target">
    <Teleport :to="toolbarTarget ?? 'body'" :disabled="!toolbarTarget">
      <v-toolbar
        v-if="showToolbar && (html || $slots['toolbar-start'] || toolbarTarget)"
        density="compact"
        class="dynamic-report-no-print"
      >
        <v-btn
          v-if="html"
          color="primary"
          variant="flat"
          :disabled="!canEdit"
          @click="editing ? (editing = false) : startEditing()"
        >
          {{
            t(
              editing
                ? 'dynamicReport.previewReport'
                : 'dynamicReport.editReport',
            )
          }}
        </v-btn>
        <slot name="toolbar-start" />
        <v-tooltip
          v-if="html"
          :text="t('dynamicReport.unsavedReport')"
          location="bottom"
          max-width="400"
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon="mdi-information-outline"
              variant="text"
              :aria-label="t('dynamicReport.unsavedReport')"
            />
          </template>
        </v-tooltip>
        <v-spacer />
        <template v-if="editing">
          <v-btn prepend-icon="mdi-camera" @click="showScreenshotDialog = true">
            {{ t('dynamicReport.addScreenshot') }}
          </v-btn>
        </template>
        <template v-if="showExport && html">
          <v-btn
            :disabled="!canEdit"
            prepend-icon="mdi-file-code-outline"
            @click="saveAsHtml"
          >
            {{ t('dynamicReport.saveHtml') }}
          </v-btn>
          <v-btn
            :disabled="!canEdit"
            prepend-icon="mdi-printer"
            @click="saveAsPdf"
          >
            {{ t('dynamicReport.savePdf') }}
          </v-btn>
        </template>
        <slot name="toolbar-end" />
        <v-btn
          v-if="toolbarTarget"
          icon="mdi-close"
          :aria-label="t('dynamicReport.closeExport')"
          @click="emit('close-export')"
        />
      </v-toolbar>
    </Teleport>
    <div
      v-if="html"
      class="dynamic-report-editor-area d-flex flex-column flex-1-1"
    >
      <div
        v-if="editing && reportContent?.editor"
        class="dynamic-report-formatting-toolbar dynamic-report-no-print bg-surface elevation-4 rounded pa-1"
      >
        <v-defaults-provider
          :defaults="{
            VBtn: { density: 'compact' },
            VBtnGroup: { density: 'compact' },
            VBtnToggle: { density: 'compact' },
          }"
        >
          <BaseMenu :editor="reportContent.editor" />
        </v-defaults-provider>
      </div>
      <DynamicReportContent
        v-if="html"
        ref="reportContent"
        :html="displayHtml"
        :style-html="html"
        :initial-editor-html="editedHtml || undefined"
        :editable="editing"
        :node-css="timeSeriesValueInputCss"
        class="flex-1-1"
        :class="{ 'dynamic-report-with-formatting': editing }"
        @update="onDocumentUpdate"
      >
        <template #node="{ node }">
          <TimeSeriesValueInput :node="node" @change="onEdit" />
        </template>
      </DynamicReportContent>
    </div>
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
import BaseMenu from './tiptap/BaseMenu.vue'
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
  showToolbar?: boolean
  toolbarTarget?: HTMLElement
}

const props = withDefaults(defineProps<Props>(), { showToolbar: true })
const emit = defineEmits<{ 'close-export': [] }>()
const { t } = useI18n()
const edits = ref(new Map<string, DynamicReportEdit>())
const editing = ref(false)
const editedHtml = ref('')
const showScreenshotDialog = ref(false)
const screenshotError = ref('')
const reportContent = ref<InstanceType<typeof DynamicReportContent>>()

watch(
  () => props.showToolbar,
  (visible) => {
    if (!visible) {
      editing.value = false
      showScreenshotDialog.value = false
    }
  },
)

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

async function onScreenshot(image: Blob, label: string, caption?: string) {
  const version = reportVersion
  screenshotError.value = ''
  try {
    if (!reportContent.value) throw new Error('The report editor is not ready')
    await reportContent.value.insertScreenshot(image, label, caption)
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

<style scoped>
.dynamic-report-editor-area {
  position: relative;
  min-height: 0;
}

.dynamic-report-formatting-toolbar {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  max-width: calc(100% - 16px);
  overflow-x: auto;
  white-space: nowrap;
}

.dynamic-report-with-formatting {
  padding-top: 64px !important;
}

@media print {
  .dynamic-report-with-formatting {
    padding-top: 0 !important;
  }
}
</style>

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
