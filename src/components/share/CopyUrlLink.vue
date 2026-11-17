<template>
  <v-card variant="flat" class="copy-url-link w-100">
    <div class="d-flex align-center">
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="copy-url-link__anchor d-flex align-center text-truncate ga-1"
        :class="{ 'copy-url-link__anchor--disabled': !url }"
      >
        <v-chip density="compact" color="primary" label class="flex-shrink-0">
          FEWS PI
        </v-chip>
        <v-chip label density="compact" class="text-truncate">
          {{ pathChipLabel }}
        </v-chip>
        <v-chip
          density="compact"
          label
          class="copy-url-link__query-chip flex-shrink-0"
          @click.prevent="expanded = !expanded"
        >
          <v-icon size="small" start icon="mdi-filter-variant" />
          <v-badge
            v-if="queryParams.length"
            :content="queryParams.length"
            color="primary"
            inline
          />
          <template #append>
            <v-icon size="small">
              {{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </template>
        </v-chip>
      </a>

      <v-spacer />
      <CopyUrlButton :url="url" />
    </div>
    <table v-if="expanded" class="copy-url-link__query-table text-label-small">
      <thead>
        <tr>
          <th class="d-none">Key</th>
          <th class="d-none">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="param in queryParams" :key="param.name">
          <td class="copy-url-link__query-name">{{ param.name }}</td>
          <td class="copy-url-link__query-value">{{ param.value }}</td>
        </tr>
      </tbody>
    </table>
  </v-card>
</template>

<script setup lang="ts">
import CopyUrlButton from './CopyUrlButton.vue'
import { computed, ref } from 'vue'

interface Props {
  url: string
}
const props = defineProps<Props>()

const expanded = ref(false)

const parsedUrl = computed(() => {
  try {
    return new URL(props.url)
  } catch {
    return null
  }
})

// Show only the path segments after the "v1" service version, e.g. /timeseries/grid
const pathChipLabel = computed(() => {
  if (!parsedUrl.value) return '/'
  const segments = parsedUrl.value.pathname.split('/').filter(Boolean)
  const versionIndex = segments.indexOf('v1')
  const relevantSegments =
    versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments
  return `/${relevantSegments.join('/')}`
})

const queryParams = computed(() => {
  if (!parsedUrl.value) return []
  return [...parsedUrl.value.searchParams.entries()].map(([name, value]) => ({
    name,
    value,
  }))
})
</script>

<style scoped>
.copy-url-link__anchor {
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
}

.copy-url-link__anchor--disabled {
  pointer-events: none;
  opacity: 0.5;
}

.copy-url-link__query-chip {
  cursor: pointer;
}

.copy-url-link__query-table {
  width: 100%;
  border-collapse: collapse;
}

.copy-url-link__query-table td {
  padding: 2px 8px;
  vertical-align: top;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.copy-url-link__query-name {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap;
}

.copy-url-link__query-value {
  word-break: break-all;
}
</style>
