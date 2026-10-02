<template>
  <div class="d-flex h-100 flex-column overflow-hidden">
    <div class="d-flex align-center ga-2 pa-2">
      <v-chip size="small" variant="tonal" color="primary">
        {{ activeCount }} in flight
      </v-chip>
      <span class="text-caption text-medium-emphasis">
        {{ history.length }} / 100 recent
      </span>
      <v-spacer />
      <v-btn
        icon="mdi-delete-sweep-outline"
        size="small"
        variant="text"
        aria-label="Clear ended requests"
        title="Clear ended requests"
        :disabled="!hasEndedRequests"
        @click="clearEndedSharedRequestHistory"
      />
    </div>
    <v-divider />
    <div class="flex-1-1 overflow-y-auto">
      <v-expansion-panels v-if="history.length" multiple variant="accordion">
        <v-expansion-panel v-for="entry in history" :key="entry.id">
          <v-expansion-panel-title class="shared-request-title">
            <div class="shared-request-title__content">
              <div class="d-flex align-center ga-1 min-width-0">
                <v-chip
                  density="compact"
                  color="primary"
                  label
                  class="flex-shrink-0"
                >
                  FEWS PI
                </v-chip>
                <v-chip
                  label
                  density="compact"
                  class="text-truncate min-width-0"
                >
                  {{ getUrlMetadata(entry.key).path }}
                </v-chip>
                <v-chip
                  density="compact"
                  label
                  class="flex-shrink-0"
                  :aria-label="`${getUrlMetadata(entry.key).query.length} query parameters`"
                >
                  <v-icon size="small" start icon="mdi-filter-variant" />
                  <v-badge
                    v-if="getUrlMetadata(entry.key).query.length"
                    :content="getUrlMetadata(entry.key).query.length"
                    color="primary"
                    inline
                  />
                </v-chip>
              </div>
              <div
                class="shared-request-title__status text-caption text-medium-emphasis"
              >
                <span>{{
                  entry.state === 'in-flight' ? 'In flight' : 'Ended'
                }}</span>
                <span>{{ getDuration(entry) }} elapsed</span>
                <span>
                  {{ entry.subscriberCount }} active /
                  {{ entry.peakSubscriberCount }} peak subscribers
                </span>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <section class="shared-request-section">
              <h3 class="shared-request-section__title">Request</h3>
              <table class="shared-request-table text-label-small">
                <tbody>
                  <tr>
                    <th>Method</th>
                    <td>Not exposed by the shared request registry</td>
                  </tr>
                  <tr>
                    <th>Endpoint</th>
                    <td>{{ getUrlMetadata(entry.key).path }}</td>
                  </tr>
                  <tr>
                    <th>Started</th>
                    <td>{{ formatTimestamp(entry.startedAt) }}</td>
                  </tr>
                  <tr>
                    <th>Subscribers</th>
                    <td>
                      {{ entry.subscriberCount }} active /
                      {{ entry.peakSubscriberCount }} peak
                    </td>
                  </tr>
                </tbody>
              </table>
              <table
                v-if="getUrlMetadata(entry.key).query.length"
                class="shared-request-table shared-request-query-table text-label-small"
              >
                <thead>
                  <tr>
                    <th>Query parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(param, index) in getUrlMetadata(entry.key).query"
                    :key="`${entry.id}-${param.name}-${index}`"
                  >
                    <td class="shared-request-query-name">{{ param.name }}</td>
                    <td class="shared-request-query-value">
                      {{ param.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section class="shared-request-section">
              <h3 class="shared-request-section__title">Response</h3>
              <table class="shared-request-table text-label-small">
                <tbody>
                  <tr>
                    <th>Lifecycle</th>
                    <td>
                      {{ entry.state === 'in-flight' ? 'In flight' : 'Ended' }}
                    </td>
                  </tr>
                  <tr v-if="entry.endedAt !== undefined">
                    <th>Ended</th>
                    <td>{{ formatTimestamp(entry.endedAt) }}</td>
                  </tr>
                  <tr>
                    <th>Duration</th>
                    <td>{{ getDuration(entry) }}</td>
                  </tr>
                  <tr>
                    <th>Outcome / fields</th>
                    <td>Not retained by the shared request registry</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-list-item v-else class="text-medium-emphasis">
        No shared requests have been observed in this session.
      </v-list-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  clearEndedSharedRequestHistory,
  sharedRequestHistory,
  type SharedRequestHistoryEntry,
} from '@/services/useSharedRequestHistory'

const history = sharedRequestHistory
const now = ref(Date.now())
const activeCount = computed(
  () => history.value.filter((entry) => entry.state === 'in-flight').length,
)
const hasEndedRequests = computed(
  () => activeCount.value < history.value.length,
)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer !== undefined) clearInterval(timer)
})

function getUrlMetadata(key: string) {
  try {
    const url = new URL(key, window.location.origin)
    const segments = url.pathname.split('/').filter(Boolean)
    const versionIndex = segments.indexOf('v1')
    const relevantSegments =
      versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments
    return {
      path: `/${relevantSegments.join('/')}`,
      query: [...url.searchParams.entries()].map(([name, value]) => ({
        name,
        value:
          /token|authorization|password|secret|signature|api[_-]?key/i.test(
            name,
          )
            ? '[redacted]'
            : value,
      })),
    }
  } catch {
    return {
      path: key.split('?')[0],
      query: [],
    }
  }
}

function getDuration(entry: SharedRequestHistoryEntry): string {
  const endTime = entry.endedAt ?? now.value
  const seconds = Math.max(0, Math.floor((endTime - entry.startedAt) / 1000))
  const minutes = Math.floor(seconds / 60)
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.shared-request-title {
  align-items: stretch;
}

.shared-request-title__content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.shared-request-title__status {
  display: flex;
  flex-wrap: wrap;
  column-gap: 12px;
  row-gap: 2px;
}

.shared-request-section + .shared-request-section {
  margin-top: 12px;
}

.shared-request-section__title {
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.shared-request-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.shared-request-table td,
.shared-request-table th {
  padding: 2px 8px;
  text-align: left;
  vertical-align: top;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.shared-request-table th {
  width: 104px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 400;
}

.shared-request-table td {
  overflow-wrap: anywhere;
}

.shared-request-query-table {
  table-layout: auto;
}

.shared-request-query-table th {
  width: auto;
}

.shared-request-query-name {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap;
}

.shared-request-query-value {
  overflow-wrap: anywhere;
}
</style>
