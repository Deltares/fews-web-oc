<template>
  <v-data-iterator
    :items="logMessages"
    :items-per-page="-1"
    item-value="creationTime"
    :search="search"
    :custom-key-filter="customKeyFilters"
    :sort-by="[{ key: 'creationTime', order: 'desc' }]"
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
          v-model="selectedUsers"
          :items="users"
          label="Filter by User"
          clearable
          hide-details
          multiple
          style="max-width: 200px"
          disabled
        ></v-select>
        <v-select
          v-model="selectedLevels"
          :items="logLevels"
          label="Filter by Level"
          clearable
          hide-details
          multiple
          style="max-width: 200px"
        ></v-select>
        <v-select
          v-model="selectedEventCodes"
          :items="eventCodes"
          label="Filter by Event Code"
          clearable
          hide-details
          multiple
          style="max-width: 200px"
        ></v-select>
        <span>Total: {{ logMessages.length }}</span>
      </v-toolbar>
    </template>
    <template v-slot:default="{ items }">
      <div class="scroll-container">
        <v-row style="margin: 0">
          <v-col
            v-for="(log, index) in items"
            :key="index"
            :class="{
              'ml-auto': isLogMessageByCurrentUser(log.raw),
              'mr-auto': !isLogMessageByCurrentUser(log.raw),
            }"
            cols="8"
          >
            <v-card
              :class="{
                'current-user-message': isLogMessageByCurrentUser(log.raw),
                'other-message': !isLogMessageByCurrentUser(log.raw),
              }"
              class="mb-2"
              :color="logToColor(log.raw)"
              outlined
            >
              <template v-slot:prepend>
                <v-icon
                  size="small"
                  :icon="
                    log.raw.logType === LogType.System
                      ? 'mdi-robot'
                      : 'mdi-account'
                  "
                ></v-icon>
              </template>
              <template v-slot:title>
                <div style="font-size: 0.8em">
                  <strong>{{ logToUser(log.raw) }}</strong>
                  @<small>{{ log.raw.creationTime.toISOString() }}</small>
                </div>
              </template>
              <v-card-text>
                {{ log.raw.message }}
              </v-card-text>
              <template v-slot:append>
                <v-icon
                  v-if="logToIcon(log.raw)"
                  size="small"
                  :icon="logToIcon(log.raw)"
                ></v-icon>
              </template>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-data-iterator>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'

const LogLevelEnum = {
  Info: 'Info',
  Warning: 'Warning',
  Error: 'Error',
} as const

type LogLevelType = (typeof LogLevelEnum)[keyof typeof LogLevelEnum]

enum LogType {
  System = 'System',
  Manual = 'Manual',
}

interface GeneralLogMessage {
  level: LogLevelType
  message: string
  creationTime: Date
  eventCode: string
  logType: LogType
}

interface ManualLogMessage extends GeneralLogMessage {
  logType: LogType.Manual
  user: string
  segment?: string
}

interface SystemLogMessage extends GeneralLogMessage {
  logType: LogType.System
  workflow: string
}

type LogMessage = ManualLogMessage | SystemLogMessage

const search = ref('')
const selectedUsers = ref<string[]>([])
const selectedLevels = ref<LogLevelType[]>([])
const selectedEventCodes = ref<string[]>([])

const currentUser = ref<User | null>(null)
onMounted((): void => {
  authenticationManager.userManager
    .getUser()
    .then((response) => {
      currentUser.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
})

const logMessages = computed(() => {
  const messages: (SystemLogMessage | ManualLogMessage)[] = [
    {
      logType: LogType.System,
      workflow: 'Run SWAN Full Model Train',
      creationTime: new Date('2024-11-01T12:12:12Z'),
      level: LogLevelEnum.Error,
      eventCode: 'TaskRun.PartlyFailed',
      message: 'Something went wrong...',
    },
    {
      logType: LogType.Manual,
      user: currentUser.value?.profile?.name ?? 'Current User',
      creationTime: new Date('2024-11-01T10:15:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message: 'Shift Ended. Just a regular day.',
    },
    {
      logType: LogType.Manual,
      user: 'Jane Doe',
      creationTime: new Date('2024-11-01T10:15:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message: 'Shift Started',
    },
    {
      logType: LogType.Manual,
      user: 'Jane Doe',
      creationTime: new Date('2024-11-01T12:30:00Z'),
      level: LogLevelEnum.Warning,
      eventCode: 'default',
      message: 'This is definitely cause for a warning.',
    },
    {
      logType: LogType.Manual,
      user: currentUser.value?.profile?.name ?? 'Current User',
      creationTime: new Date('2024-11-01T18:30:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message: 'Shift Started',
    },
    {
      logType: LogType.Manual,
      user: currentUser.value?.profile?.name ?? 'Current User',
      creationTime: new Date('2024-11-01T23:31:00Z'),
      level: LogLevelEnum.Error,
      eventCode: 'default',
      message: 'Oh no.',
    },
    {
      logType: LogType.Manual,
      user: currentUser.value?.profile?.name ?? 'Current User',
      creationTime: new Date('2024-11-02T02:25:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message:
        'This is a very long message, just to show what it will look like if a message is so long that it will span mutiple lines.',
    },
  ]
  return messages
})

const users = computed(() => {
  return [
    ...new Set(
      logMessages.value
        .filter((log) => log.logType === LogType.Manual)
        .map((log) => log.user),
    ),
  ]
})

const eventCodes = computed(() => {
  return [...new Set(logMessages.value.map((log) => log.eventCode))]
})

const isLogMessageByCurrentUser = (log: LogMessage) => {
  if (log.logType === LogType.System) return false
  return log.user === currentUser.value?.profile?.name
}

const logToUser = (log: LogMessage) => {
  if (log.logType === LogType.System) return 'System'
  return isLogMessageByCurrentUser(log) ? 'You' : log.user
}

const logLevels = Object.values(LogLevelEnum)

const customKeyFilters: Record<
  string,
  (value: string, query: string, item?: any) => boolean
> = {
  // user: (value: string, query: string, item?: any) => {
  //   if (selectedUsers.value.length === 0) return true
  //   return selectedUsers.value.includes(item.raw.user)
  // },
  level: (value: string, query: string, item?: any) => {
    if (selectedLevels.value.length === 0) return true
    return selectedLevels.value.includes(item.raw.level)
  },
  eventCode: (value: string, query: string, item?: any) => {
    if (selectedEventCodes.value.length === 0) return true
    return selectedEventCodes.value.includes(item.raw.eventCode)
  },
}

const logToColor = (log: LogMessage) => {
  switch (log.level) {
    case LogLevelEnum.Info:
      return isLogMessageByCurrentUser(log) ? 'surface-variant' : 'surface'
    case LogLevelEnum.Warning:
      return 'warning'
    case LogLevelEnum.Error:
      return 'error'
  }
}

const logToIcon = (log: LogMessage) => {
  switch (log.level) {
    case LogLevelEnum.Info:
      return '$info'
    case LogLevelEnum.Warning:
      return '$warning'
    case LogLevelEnum.Error:
      return '$error'
  }
}
</script>

<style scoped>
.current-user-message {
  border-radius: 12px 12px 0 12px;
  text-align: left;
}

.other-message {
  border-radius: 12px 12px 12px 0;
  text-align: left;
}

.scroll-container {
  height: 83vh;
  overflow-y: auto;
  width: 100%;
}
</style>
