<template>
  <v-data-iterator
    :items="logMessages"
    :items-per-page="4"
    :search="search"
    :custom-key-filter="customKeyFilters"
  >
    <template v-slot:header>
      <v-toolbar class="px-2">
        <v-text-field
          v-model="search"
          placeholder="Search"
          prepend-inner-icon="mdi-magnify"
          style="max-width: 300px"
          variant="solo"
          clearable
          hide-details
        ></v-text-field>
        <v-select
          v-model="selectedUser"
          :items="users"
          label="Filter by User"
          clearable
          hide-details
          style="max-width: 200px"
        ></v-select>
        <v-select
          v-model="selectedLevel"
          :items="logLevels"
          label="Filter by Level"
          clearable
          hide-details
          style="max-width: 200px"
        ></v-select>
      </v-toolbar>
    </template>
    <template v-slot:default="{ items }">
      <v-row>
        <v-col v-for="(log, index) in items" :key="index" cols="8">
          <v-card class="message mb-2" outlined>
            <v-card-title>
              <div>
                <strong>{{ log.raw.user }}</strong>
                <br />
                <small>{{ log.raw.timestamp }}</small>
              </div>
            </v-card-title>
            <v-card-text>
              {{ log.raw.message }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <template v-slot:footer="{ page, pageCount, prevPage, nextPage }">
      <v-footer class="justify-space-between text-body-2 mt-4">
        Total: {{ logMessages.length }}
        <div>Page {{ page }} of {{ pageCount }}</div>
        <div class="d-inline-flex">
          <v-btn
            :disabled="page === 1"
            class="me-2"
            icon="mdi-arrow-left"
            size="small"
            variant="tonal"
            @click="prevPage"
          ></v-btn>
          <v-btn
            :disabled="page === pageCount"
            icon="mdi-arrow-right"
            size="small"
            variant="tonal"
            @click="nextPage"
          ></v-btn>
        </div>
      </v-footer>
    </template>
  </v-data-iterator>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const LogLevelEnum = {
  Info: 'Info',
  Warning: 'Warning',
  Error: 'Error',
} as const

type LogLevelType = (typeof LogLevelEnum)[keyof typeof LogLevelEnum]

interface LogMessage {
  user: string
  level: LogLevelType
  message: string
  timestamp: string
}

const search = ref('')
const selectedUser = ref<string | null>(null)
const selectedLevel = ref<LogLevelType | null>(null)

const logMessages: LogMessage[] = [
  {
    user: 'Anne Markensteijn',
    timestamp: new Date('2024-11-01T10:15:00Z').toISOString(),
    level: LogLevelEnum.Info,
    message: 'Shift Ended. Just a regular day.',
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T10:15:00Z').toISOString(),
    level: LogLevelEnum.Info,
    message: 'Shift Started.',
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T12:30:00Z').toISOString(),
    level: LogLevelEnum.Warning,
    message: 'This is definitely cause for a warning.',
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T18:30:00Z').toISOString(),
    level: LogLevelEnum.Info,
    message: 'Shift Ended.',
  },
  {
    user: 'Anne Markensteijn',
    timestamp: new Date('2024-11-01T18:30:00Z').toISOString(),
    level: LogLevelEnum.Info,
    message: 'Shift Started.',
  },
  {
    user: 'Anne Markensteijn',
    timestamp: new Date('2024-11-01T23:31:00Z').toISOString(),
    level: LogLevelEnum.Error,
    message: 'Oh no.',
  },
]

const users = computed(() => {
  return [...new Set(logMessages.map((log) => log.user))]
})

const logLevels = Object.values(LogLevelEnum)

const customKeyFilters: Record<
  string,
  (value: string, query: string, item?: any) => boolean
> = {
  user: (value: string, query: string, item?: any) => {
    return selectedUser.value ? item.raw.user === selectedUser.value : true
  },
  level: (value: string, query: string, item?: any) => {
    return selectedLevel.value ? item.raw.level === selectedLevel.value : true
  },
}
</script>

<style scoped>
.message {
  background-color: rgb(
    var(--v-theme-surface)
  ); /* Light grey for other messages */
  color: rgb(var(--v-theme-on-surface));
  border-radius: 12px 12px 12px 0;
  text-align: left;
}

.v-card-title {
  font-size: 0.9em;
  color: #6c757d; /* Muted text color for user and timestamp */
}
</style>
