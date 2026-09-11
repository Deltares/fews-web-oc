<template>
  <div class="report-snapshot-frame">
    <iframe
      v-if="src"
      :src="src"
      title="Report snapshot"
      class="report-snapshot-frame__iframe"
      tabindex="-1"
    ></iframe>
    <div v-else class="report-snapshot-frame__empty">No report available</div>
  </div>
</template>

<script setup lang="ts">
import { useReport } from '@/services/useReport'
import type { ReportItem } from '@deltares/fews-pi-requests'
import { ref, watch } from 'vue'

interface Props {
  baseUrl: string
  reportItem?: ReportItem
}

const props = defineProps<Props>()

const { reportHtml } = useReport(
  props.baseUrl,
  () => props.reportItem?.moduleInstanceId,
  () => props.reportItem?.taskRunId,
  () => props.reportItem?.reportId,
)
const src = ref('')

watch(
  reportHtml,
  (html, _previousHtml, onCleanup) => {
    src.value = ''
    if (!html) return

    const objectUrl = globalThis.URL.createObjectURL(
      new Blob([html], { type: 'text/html' }),
    )
    src.value = objectUrl
    onCleanup(() => globalThis.URL.revokeObjectURL(objectUrl))
  },
  { immediate: true },
)
</script>

<style scoped>
.report-snapshot-frame {
  position: relative;
  width: 136px;
  aspect-ratio: 1 / 1.16;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.report-snapshot-frame__iframe {
  width: 600%;
  height: 600%;
  border: 0;
  pointer-events: none;
  transform: scale(0.1667);
  transform-origin: 0 0;
}

.report-snapshot-frame__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
}
</style>
