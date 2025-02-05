<template>
  <v-data-iterator
    :items="logMessages"
    :items-per-page="-1"
    item-value="creationTime"
    :search="search"
    :custom-key-filter="customKeyFilters"
    :sort-by="[{ key: 'creationTime', order: 'desc' }]"
    class="d-flex flex-column h-100 w-100"
  >
    <template #header>
      <div class="d-flex ga-2 align-center pa-2">
        <v-text-field
          v-model="search"
          placeholder="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          max-width="300px"
          density="compact"
        />
        <v-select
          v-model="selectedLogType"
          :items="selectableLogTypes"
          label="Select log type"
          variant="outlined"
          clearable
          hide-details
          max-width="200px"
          density="compact"
        />
        <v-select
          v-model="selectedUsers"
          :items="users"
          label="Filter by User"
          variant="outlined"
          clearable
          hide-details
          multiple
          max-width="200px"
          density="compact"
        />
        <v-select
          v-model="selectedLevels"
          :items="logLevels"
          label="Filter by Level"
          variant="outlined"
          clearable
          hide-details
          multiple
          max-width="200px"
          density="compact"
        />
        <v-select
          v-model="selectedEventCodes"
          :items="eventCodes"
          label="Filter by Event Code"
          variant="outlined"
          clearable
          hide-details
          multiple
          max-width="250px"
          density="compact"
        />
        <v-dialog v-model="newMessageDialog" max-width="500px">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-plus" variant="text" />
          </template>
          <v-card>
            <v-card-title>New Log Message</v-card-title>
            <v-card-text>
              <v-select
                v-model="newLogLevel"
                :items="logLevels"
                label="Log level"
              />
              <v-text-field v-model="newLogMessage" label="Message" />
            </v-card-text>
            <v-card-actions>
              <v-btn
                text="Save"
                variant="flat"
                color="primary"
                @click="saveNewMessage"
              />
              <v-btn text="Close" @click="newMessageDialog = false" />
            </v-card-actions>
          </v-card>
        </v-dialog>
        <span>Total: {{ logMessages.length }}</span>
      </div>
    </template>
    <template #default="{ items }">
      <div class="scroll-container pa-2">
        <v-row class="ma-0">
          <v-col
            v-for="log in items"
            :class="{
              'ml-auto': isLogMessageByCurrentUser(log.raw),
              'mr-auto': !isLogMessageByCurrentUser(log.raw),
            }"
            cols="8"
            class="pa-0"
          >
            <v-card
              :class="{
                'current-user-message': isLogMessageByCurrentUser(log.raw),
                'other-message': !isLogMessageByCurrentUser(log.raw),
              }"
              :color="logToColor(log.raw)"
              class="mb-4"
              border
              flat
            >
              <template #prepend>
                <v-icon size="small" :icon="logToUserIcon(log.raw)" />
              </template>
              <template #title>
                <div class="d-flex align-end ga-2">
                  <div class="font-weight-bold">{{ logToUser(log.raw) }}</div>
                  <v-card-subtitle>{{
                    log.raw.creationTime.toISOString()
                  }}</v-card-subtitle>
                  <v-btn
                    v-if="log.raw.topologyNodeId"
                    :to="logToRoute(log.raw)"
                    density="compact"
                    icon="mdi-link-variant"
                    variant="plain"
                  />
                </div>
              </template>
              <v-card-text>
                {{ log.raw.message }}
              </v-card-text>
              <template #append>
                <v-icon
                  v-if="logToIcon(log.raw)"
                  size="small"
                  :icon="logToIcon(log.raw)"
                />
              </template>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-data-iterator>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'
import {
  LogLevelEnum,
  LogType,
  type LogLevelType,
  type ManualLogMessage,
  type SystemLogMessage,
  type LogMessage,
} from '@/lib/log'
import type { LogsDisplay } from '@deltares/fews-pi-requests'

interface Props {
  logDisplay: LogsDisplay
}

defineProps<Props>()

const newMessageDialog = ref(false)
const newLogLevel = ref<LogLevelType>(LogLevelEnum.Info)
const newLogMessage = ref('')

const search = ref('')
const selectedUsers = ref<string[]>([])
const selectedLevels = ref<LogLevelType[]>([])
const selectedEventCodes = ref<string[]>([])
const selectedLogType = ref<LogType | null>(null)
const selectableLogTypes = [
  {
    title: LogType.Manual,
    value: LogType.Manual,
    props: { prependIcon: 'mdi-account-multiple-outline' },
  },
  {
    title: LogType.System,
    value: LogType.System,
    props: { prependIcon: 'mdi-robot-outline' },
  },
]

const currentUser = ref<User | null>(null)
onMounted(() => {
  authenticationManager.userManager
    ?.getUser()
    .then((response) => {
      currentUser.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
})

const originalManualLogMessages = computed(() => {
  const messages: ManualLogMessage[] = [
    {
      logType: LogType.Manual,
      user: getUserName(),
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
      topologyNodeId: 'operations.polder',
    },
    {
      logType: LogType.Manual,
      user: getUserName(),
      creationTime: new Date('2024-11-01T18:30:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message: 'Shift Started',
    },
    {
      logType: LogType.Manual,
      user: getUserName(),
      creationTime: new Date('2024-11-01T23:31:00Z'),
      level: LogLevelEnum.Error,
      eventCode: 'default',
      message: 'Oh no.',
      topologyNodeId: 'viewer.main.polder.structures',
    },
    {
      logType: LogType.Manual,
      user: 'Jane Doe',
      creationTime: new Date('2024-11-02T02:25:00Z'),
      level: LogLevelEnum.Info,
      eventCode: 'default',
      message:
        'This is a very long message, just to show what it will look like if a message is so long that it will span mutiple lines. A really, really, really, really long message. Because it has too span multiple lines. And not just one. That would not actually show what a long message would look like. And is has to span those multiple lines, even on large screens, which people might use in, for instance, conference rooms and such.',
    },
  ]
  return messages
})

const manualLogMessages = ref<ManualLogMessage[]>([])

watch(currentUser, () => {
  manualLogMessages.value = originalManualLogMessages.value
})

const systemLogMessages = computed(() => {
  const messages: SystemLogMessage[] = [
    {
      logType: LogType.System,
      workflow: 'Run SWAN Full Model Train',
      creationTime: new Date('2024-11-01T11:03:08Z'),
      level: LogLevelEnum.Info,
      eventCode: 'Workflow.ActivityStarted',
      message: 'Started the SWAN Full Model Train',
    },
    {
      logType: LogType.System,
      workflow: 'Run SWAN Full Model Train',
      creationTime: new Date('2024-11-01T12:12:12Z'),
      level: LogLevelEnum.Error,
      eventCode: 'TaskRun.PartlyFailed',
      message: 'Something went wrong...',
    },
  ]
  return messages
})

const logMessages = computed<LogMessage[]>(() => {
  return [...manualLogMessages.value, ...systemLogMessages.value].map((log) => {
    return {
      user: logToUser(log),
      workflow: '',
      ...log,
    }
  })
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

function isLogMessageByCurrentUser(log: ManualLogMessage | SystemLogMessage) {
  if (log.logType === LogType.System) return false
  return log.user === getUserName()
}

function logToUser(log: ManualLogMessage | SystemLogMessage) {
  if (log.logType === LogType.System) return 'System'
  return isLogMessageByCurrentUser(log) ? 'You' : log.user
}

const logLevels = Object.values(LogLevelEnum)

const customKeyFilters: Record<
  string,
  (value: string, query: string, item?: any) => boolean
> = {
  logType: (_value, _query, item) => {
    if (!selectedLogType.value) return true
    return selectedLogType.value === item.raw.logType
  },
  user: (_value, _query, item) => {
    if (selectedUsers.value.length === 0) return true
    return selectedUsers.value.includes(item.raw.user)
  },
  level: (_value, _query, item) => {
    if (selectedLevels.value.length === 0) return true
    return selectedLevels.value.includes(item.raw.level)
  },
  eventCode: (_value, _query, item) => {
    if (selectedEventCodes.value.length === 0) return true
    return selectedEventCodes.value.includes(item.raw.eventCode)
  },
}

function logToColor(log: LogMessage) {
  switch (log.level) {
    case LogLevelEnum.Info:
      return isLogMessageByCurrentUser(log) ? 'info' : 'surface'
    case LogLevelEnum.Warning:
      return 'warning'
    case LogLevelEnum.Error:
      return 'red-darken-4'
  }
}

function logToUserIcon(log: LogMessage) {
  switch (log.logType) {
    case LogType.System:
      return 'mdi-robot'
    case LogType.Manual:
      return 'mdi-account'
  }
}

function logToIcon(log: LogMessage) {
  switch (log.level) {
    case LogLevelEnum.Info:
      return '$info'
    case LogLevelEnum.Warning:
      return '$warning'
    case LogLevelEnum.Error:
      return '$error'
  }
}

function logToRoute(log: LogMessage) {
  return {
    name: 'TopologyDisplay',
    params: { nodeId: log.topologyNodeId },
  }
}

function saveNewMessage() {
  const newMessage: ManualLogMessage = {
    logType: LogType.Manual,
    user: getUserName(),
    creationTime: new Date(),
    level: newLogLevel.value,
    eventCode: 'default',
    message: newLogMessage.value,
  }
  manualLogMessages.value.push(newMessage)
  newMessageDialog.value = false
  newLogMessage.value = ''
  newLogLevel.value = LogLevelEnum.Info
}

function getUserName() {
  return currentUser.value?.profile?.name ?? 'Current User'
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
