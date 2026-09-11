<template>
  <div class="report-snapshot-strip">
    <div class="report-snapshot-strip__items">
      <button
        v-for="report in reports"
        :key="report.moduleInstanceId"
        type="button"
        class="report-snapshot-strip__item"
        :class="{
          'report-snapshot-strip__item--selected':
            report.moduleInstanceId === selectedReport?.moduleInstanceId,
          'report-snapshot-strip__item--collapsed': collapsed,
        }"
        @click="emit('update:selectedReport', report)"
      >
        <ReportSnapshotFrame
          v-if="!collapsed"
          :baseUrl="baseUrl"
          :reportItem="currentReportItem(report)"
        />
        <span class="report-snapshot-strip__title">{{
          reportToTitle(report)
        }}</span>
        <span
          v-if="currentReportItem(report)"
          class="report-snapshot-strip__time"
        >
          {{ currentReportItem(report)?.timeZero }}
        </span>
      </button>
      <v-btn
        class="report-snapshot-strip__toggle"
        variant="text"
        density="compact"
        :icon="collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
        :aria-label="
          collapsed ? 'Expand report snapshots' : 'Collapse report snapshots'
        "
        @click="collapsed = !collapsed"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Report, ReportItem } from '@deltares/fews-pi-requests'
import { ref } from 'vue'
import ReportSnapshotFrame from './ReportSnapshotFrame.vue'

interface Props {
  baseUrl: string
  reports: Report[]
  selectedReport?: Report
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedReport', report: Report): void
}>()

const collapsed = ref(false)

function currentReportItem(report: Report): ReportItem | undefined {
  return report.items.find((item) => item.isCurrent) ?? report.items[0]
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
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
}

.report-snapshot-strip__toggle {
  margin-left: auto;
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

.report-snapshot-strip__title,
.report-snapshot-strip__time {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-snapshot-strip__title {
  font-size: 0.8125rem;
  font-weight: 500;
}

.report-snapshot-strip__time {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
}
</style>
