<template>
  <div v-if="isEnabled">
    <div class="d-flex align-center px-4 py-3">
      <v-icon icon="mdi-puzzle-outline" class="mr-3" />

      <span class="text-body-1"> Microfrontend Remotes </span>

      <v-spacer />

      <span class="text-caption text-medium-emphasis mr-2">
        {{ lastChecked ? lastChecked.toLocaleTimeString() : 'Never' }}
      </span>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="isChecking"
        :disabled="isChecking"
        @click="checkAllRemotes"
      >
        <v-icon />
        <v-tooltip activator="parent" location="bottom">
          Refresh status
        </v-tooltip>
      </v-btn>
    </div>

    <v-list slim class="py-0">
      <div v-for="remote in remotes" :key="remote.name" class="px-4 py-3">
        <div class="d-flex align-center">
          <v-icon
            size="small"
            :icon="statusIcon(statuses[remote.name])"
            :color="statusColor(statuses[remote.name])"
            class="mr-3"
          />

          <span class="text-body-1">
            {{ remote.name }}
          </span>

          <v-spacer />

          <div class="d-flex align-center ga-3">
            <span
              v-if="responseTimes[remote.name] !== undefined"
              class="text-caption text-medium-emphasis"
            >
              {{ responseTimes[remote.name] }} ms
            </span>

            <v-chip
              :color="statusColor(statuses[remote.name])"
              size="small"
              variant="tonal"
            >
              {{ statusLabel(statuses[remote.name]) }}
            </v-chip>
          </div>
        </div>

        <div class="text-body-1 ml-8 mt-2">
          <a :href="getRemoteEntryUrl(remote.entry)" target="_blank">
            {{ remote.entry }}
          </a>
        </div>
      </div>
    </v-list>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMicroFrontEnd } from '@/composables/useMicroFrontEnd'
import { type RemoteWithEntry } from '@module-federation/sdk'

type RemoteStatus = 'unknown' | 'checking' | 'up' | 'down'

const statuses = ref<Record<string, RemoteStatus>>({})
const responseTimes = ref<Record<string, number>>({})
const isChecking = ref(false)
const lastChecked = ref<Date | null>(null)
const { isEnabled, getRemotes } = useMicroFrontEnd()

const remotes = computed(() => {
  return getRemotes()
})

function statusColor(status: RemoteStatus | undefined): string {
  switch (status) {
    case 'up':
      return 'success'
    case 'down':
      return 'error'
    case 'checking':
      return 'warning'
    default:
      return 'grey'
  }
}

function statusIcon(status: RemoteStatus | undefined): string {
  switch (status) {
    case 'up':
      return 'mdi-check-circle'
    case 'down':
      return 'mdi-close-circle'
    case 'checking':
      return 'mdi-loading'
    default:
      return 'mdi-help-circle'
  }
}

function statusLabel(status: RemoteStatus | undefined): string {
  switch (status) {
    case 'up':
      return 'Online'
    case 'down':
      return 'Offline'
    case 'checking':
      return 'Checking...'
    default:
      return 'Unknown'
  }
}

function getRemoteEntryUrl(url: string): string {
  return url
}

async function checkRemote(remote: RemoteWithEntry): Promise<void> {
  const url = getRemoteEntryUrl(remote.entry)
  const start = performance.now()

  statuses.value[remote.name] = 'checking'
  delete responseTimes.value[remote.name]

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    statuses.value[remote.name] = 'up'
    responseTimes.value[remote.name] = Math.round(performance.now() - start)
  } catch {
    statuses.value[remote.name] = 'down'
  }
}

async function checkAllRemotes(): Promise<void> {
  isChecking.value = true

  try {
    await Promise.all(remotes.value.map(checkRemote))
    lastChecked.value = new Date()
  } finally {
    isChecking.value = false
  }
}

onMounted(() => {
  checkAllRemotes()
})
</script>
