<template>
  <div class="report-snapshot-strip">
    <div
      ref="scrollContainer"
      class="report-snapshot-strip__items"
      @wheel="handleWheel"
    >
      <button
        v-for="report in reports"
        :key="report.moduleInstanceId"
        type="button"
        class="report-snapshot-strip__item"
        :class="{
          'report-snapshot-strip__item--selected':
            report.moduleInstanceId === selectedReport?.moduleInstanceId,
          'report-snapshot-strip__item--collapsed': !expanded,
        }"
        @click="emit('update:selectedReport', report)"
      >
        <ReportSnapshotFrame
          v-if="expanded"
          :baseUrl="baseUrl"
          :reportItem="currentReportItem(report)"
        />
        <span class="report-snapshot-strip__title">{{
          reportToTitle(report)
        }}</span>
        <span
          v-if="currentReportItem(report)"
          class="report-snapshot-strip__meta"
        >
          <span
            v-if="currentReportItem(report)?.isCurrent"
            class="report-snapshot-strip__label"
          >
            {{ t('reports.latest') }}
          </span>
          <span class="report-snapshot-strip__time">
            {{ formatReportTime(report) }}
          </span>
        </span>
      </button>
      <v-btn
        class="report-snapshot-strip__toggle"
        variant="text"
        density="compact"
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        :aria-label="
          expanded
            ? t('reports.collapseSnapshots')
            : t('reports.expandSnapshots')
        "
        @click="expanded = !expanded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Report, ReportItem } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { toRelativeTimeString } from '@/lib/date'
import ReportSnapshotFrame from './ReportSnapshotFrame.vue'

interface Props {
  baseUrl: string
  reports: Report[]
  selectedReport?: Report
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'update:selectedReport', report: Report): void
}>()

const expanded = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

function handleWheel(event: WheelEvent) {
  if (event.ctrlKey) {
    return
  }

  const container = scrollContainer.value
  if (!container) {
    return
  }

  event.preventDefault()
  container.scrollLeft += event.deltaY + event.deltaX
}

function currentReportItem(report: Report): ReportItem | undefined {
  return report.items.find((item) => item.isCurrent) ?? report.items[0]
}

function formatReportTime(report: Report): string {
  const item = currentReportItem(report)
  return item?.timeZero ? toRelativeTimeString(item.timeZero) : ''
}

function reportToTitle(report: Report) {
  return report.moduleInstanceName ?? report.moduleInstanceId
}
</script>

<style scoped>
.report-snapshot-strip {
  flex: 0 0 auto;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
}

.report-snapshot-strip__items {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
  padding: 0;
}

.report-snapshot-strip__toggle {
  position: sticky;
  top: 0;
  right: 0;
  margin-left: auto;
  align-self: flex-start;
  z-index: 1;
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 999px;
}

.report-snapshot-strip__item {
  display: grid;
  flex: 0 0 auto;
  justify-items: center;
  gap: 4px;
  box-sizing: border-box;
  width: 150px;
  padding: 6px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.report-snapshot-strip__item--collapsed {
  display: block;
  width: auto;
  max-width: 220px;
  padding: 2px 8px;
  border-radius: 4px;
}

.report-snapshot-strip__item--selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.report-snapshot-strip__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.report-snapshot-strip__title,
.report-snapshot-strip__time,
.report-snapshot-strip__label {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-snapshot-strip__title {
  width: 100%;
  font-size: 0.8125rem;
  font-weight: 500;
}

.report-snapshot-strip__label {
  color: rgb(var(--v-theme-primary));
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.report-snapshot-strip__time {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
}
</style>
