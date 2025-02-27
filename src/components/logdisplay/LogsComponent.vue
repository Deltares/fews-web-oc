<template>
  <v-data-iterator
    :items="logMessages"
    :items-per-page="-1"
    :search="search"
    :custom-key-filter="customKeyFilters"
    :sort-by="[{ key: 'entryTime', order: 'desc' }]"
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
                  <v-card-subtitle>{{ log.raw.entryTime }}</v-card-subtitle>
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
                {{ log.raw.text }}
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
import { ref, computed, onMounted } from 'vue'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'
import {
  type LogMessage,
  type LogType,
  type LogLevel,
  logLevels,
} from '@/lib/log'
import {
  LogDisplayManualLog,
  LogDisplaySystemLog,
  type LogDisplayLogsFilter,
  type LogsDisplay,
} from '@deltares/fews-pi-requests'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { configManager } from '@/services/application-config'

interface Props {
  logDisplay: LogsDisplay
}

const props = defineProps<Props>()

const newMessageDialog = ref(false)
const newLogLevel = ref<LogLevel>('INFO')
const newLogMessage = ref('')

const search = ref('')
const selectedUsers = ref<string[]>([])
const selectedLevels = ref<LogLevel[]>([])
const selectedEventCodes = ref<string[]>([])
const selectedLogType = ref<LogType | null>(null)
const selectableLogTypes = [
  {
    title: 'Manual',
    value: 'manual',
    props: { prependIcon: 'mdi-account-multiple-outline' },
  },
  {
    title: 'System',
    value: 'system',
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

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const filters = computed(() => {
  const baseFilter: LogDisplayLogsFilter = {
    logDisplayId: props.logDisplay.id,
  }

  const manualLogSettings = props.logDisplay.manualLog
  const systemLogSettings = props.logDisplay.systemLog

  const manualFilters = manualLogSettings
    ? getManualFilters(baseFilter, manualLogSettings)
    : []
  const systemFilters = systemLogSettings
    ? getSystemFilters(baseFilter, systemLogSettings)
    : []
  return [...manualFilters, ...systemFilters]
})

function getManualFilters(
  baseFilter: LogDisplayLogsFilter,
  settings: LogDisplayManualLog,
): LogDisplayLogsFilter[] {
  return [
    {
      ...baseFilter,
      logType: 'manual',
      level: 'INFO',
      eventCode: `Manual.event.${settings.noteGroupId}`,
    },
  ]
}

function getSystemFilters(
  baseFilter: LogDisplayLogsFilter,
  settings: LogDisplaySystemLog,
): LogDisplayLogsFilter[] {
  const logLevelFilter: LogDisplayLogsFilter = {
    ...baseFilter,
    logType: 'system',
    level: settings.logLevel,
  }
  const codeFilters: LogDisplayLogsFilter[] =
    settings.eventCodes?.map((eventCode) => ({
      ...baseFilter,
      logType: 'system',
      eventCode,
    })) ?? []

  if (logLevelFilter.level) {
    return [logLevelFilter, ...codeFilters]
  } else {
    return codeFilters
  }
}

const { logMessages, manualLogMessages } = useLogDisplayLogs(baseUrl, filters)

const users = computed(() => [
  ...new Set(manualLogMessages.value.map((log) => log.user)),
])

const eventCodes = computed(() => [
  ...new Set(logMessages.value.map((log) => log.code)),
])

function isLogMessageByCurrentUser(log: LogMessage) {
  if (log.type === 'system') return false
  return log.user === getUserName()
}

function logToUser(log: LogMessage) {
  if (log.type === 'system') return 'System'
  return isLogMessageByCurrentUser(log) ? 'You' : log.user
}

type CustomKeyFilter = (
  value: string,
  query: string,
  item?: { raw: LogMessage },
) => boolean
const customKeyFilters: Record<string, CustomKeyFilter> = {
  type: (_value, _query, item) => {
    if (!selectedLogType.value) return true
    if (!item) return false
    return selectedLogType.value === item.raw.type
  },
  user: (_value, _query, item) => {
    if (selectedUsers.value.length === 0) return true
    if (!item) return false
    if (item.raw.user === undefined) return false
    return selectedUsers.value.includes(item.raw.user)
  },
  level: (_value, _query, item) => {
    if (selectedLevels.value.length === 0) return true
    if (!item) return false
    return selectedLevels.value.includes(item.raw.level)
  },
  code: (_value, _query, item) => {
    if (selectedEventCodes.value.length === 0) return true
    if (!item) return false
    return selectedEventCodes.value.includes(item.raw.code)
  },
}

function logToColor(log: LogMessage) {
  switch (log.level) {
    case 'INFO':
      return isLogMessageByCurrentUser(log) ? 'info' : 'surface'
    case 'WARN':
      return 'warning'
    case 'ERROR':
      return 'red-darken-4'
  }
}

function logToUserIcon(log: LogMessage) {
  switch (log.type) {
    case 'system':
      return 'mdi-robot'
    case 'manual':
      return 'mdi-account'
  }
}

function logToIcon(log: LogMessage) {
  switch (log.level) {
    case 'INFO':
      return '$info'
    case 'WARN':
      return '$warning'
    case 'ERROR':
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
  // TODO:
  // const newMessage: LogMessage = {
  //   id: 0,
  //   taskRunId: 'new',
  //   type: 'manual',
  //   user: getUserName(),
  //   entryTime: convertJSDateToFewsPiParameter(new Date()),
  //   level: newLogLevel.value,
  //   code: 'default',
  //   text: newLogMessage.value,
  //   eventAcknowledged: false,
  //   source: 'manual',
  //   componentId: 'OC',
  // }
  newMessageDialog.value = false
  newLogMessage.value = ''
  newLogLevel.value = 'INFO'
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
