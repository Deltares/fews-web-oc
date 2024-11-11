<template>
  <v-data-iterator
    :items="logMessages"
    :items-per-page="-1"
    item-value="timestamp"
    :search="search"
    :custom-key-filter="customKeyFilters"
    :sort-by="[{ key: 'timestamp', order: 'desc' }]"
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
        <span>Total: {{ logMessages.length }}</span>
      </v-toolbar>
    </template>
    <template v-slot:default="{ items, isExpanded, toggleExpand }">
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
                <v-icon size="small" icon="mdi-account"></v-icon>
              </template>
              <template v-slot:title>
                <div style="font-size: 0.8em">
                  <strong>{{
                    isLogMessageByCurrentUser(log.raw) ? 'You' : log.raw.user
                  }}</strong>
                  @<small>{{ log.raw.timestamp.toISOString() }}</small>
                </div>
              </template>
              <template v-slot:append>
                <v-icon
                  v-if="logToIcon(log.raw)"
                  size="small"
                  :icon="logToIcon(log.raw)"
                ></v-icon>
              </template>
              <v-card-text>
                <div v-if="!isExpanded(log as any)">
                  <strong>{{ log.raw.messages[0].title }}</strong
                  >{{
                    log.raw.messages[0]?.value
                      ? ': ' + log.raw.messages[0]?.value
                      : ''
                  }}
                </div>
                <div
                  v-else
                  v-for="(sublog, subindex) in log.raw.messages"
                  :key="subindex"
                >
                  <strong>{{ sublog.title }}</strong
                  >{{ sublog?.value ? ': ' + sublog.value : '' }}
                </div>
                <v-spacer>
                  <v-btn
                    v-show="log.raw.messages.length > 1"
                    :icon="
                      isExpanded(log as any)
                        ? 'mdi-chevron-up'
                        : 'mdi-chevron-down'
                    "
                    size="small"
                    variant="plain"
                    density="compact"
                    @click="() => toggleExpand(log as any)"
                  ></v-btn>
                </v-spacer>
              </v-card-text>
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

interface LogMessage {
  user: string
  level: LogLevelType
  messages: LogSubMessage[]
  timestamp: Date
}

const SubmessageEnum = {
  Text: 'text',
  Choice: 'choice',
} as const
type SubmessageType = (typeof SubmessageEnum)[keyof typeof SubmessageEnum]

interface LogSubMessage {
  type: SubmessageType
  title: string
  value?: string
}

const search = ref('')
const selectedUser = ref<string | null>(null)
const selectedLevel = ref<LogLevelType | null>(null)

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

const logMessages = computed(() => [
  {
    user: currentUser.value?.profile?.name ?? 'Current User',
    timestamp: new Date('2024-11-01T10:15:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Shift Ended',
        value: 'Just a regular day.',
      },
    ],
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T10:15:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Shift Started',
      },
    ],
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T12:30:00Z'),
    level: LogLevelEnum.Warning,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Remark pumping',
        value: 'This is definitely cause for a warning.',
      },
    ],
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T18:30:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Shift Started.',
        value: 'Im looking forward to a great day.',
      },
      {
        type: SubmessageEnum.Choice,
        title: 'Send warning Report',
        value: 'yes',
      },
    ],
  },
  {
    user: currentUser.value?.profile?.name ?? 'Current User',
    timestamp: new Date('2024-11-01T18:30:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Shift Started',
      },
    ],
  },
  {
    user: currentUser.value?.profile?.name ?? 'Current User',
    timestamp: new Date('2024-11-01T23:31:00Z'),
    level: LogLevelEnum.Error,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'General Remarks',
        value: 'Oh no.',
      },
      {
        type: SubmessageEnum.Text,
        title: 'Remark pumping',
        value: 'There is something very wrong with this pump.',
      },
      {
        type: SubmessageEnum.Choice,
        title: 'SMS send',
        value: 'yes',
      },
    ],
  },
  {
    user: currentUser.value?.profile?.name ?? 'Current User',
    timestamp: new Date('2024-11-01T23:58:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'General Remarks',
        value: 'Problem has been fixed.',
      },
      {
        type: SubmessageEnum.Text,
        title: 'Remark pumping',
        value: 'The pump has been fixed and is working again.',
      },
      {
        type: SubmessageEnum.Choice,
        title: 'SMS send',
        value: 'yes',
      },
    ],
  },
  {
    user: currentUser.value?.profile?.name ?? 'Current User',
    timestamp: new Date('2024-11-02T02:25:00Z'),
    level: LogLevelEnum.Info,
    messages: [
      {
        type: SubmessageEnum.Text,
        title: 'Shift Ended',
      },
      {
        type: SubmessageEnum.Text,
        title: 'General Remarks',
        value:
          'This is a very long message, just to show what it will look like if a message is so long that it will span mutiple lines.',
      },
    ],
  },
])

const users = computed(() => {
  return [...new Set(logMessages.value.map((log) => log.user))]
})

const isLogMessageByCurrentUser = (log: LogMessage) => {
  return log.user === currentUser.value?.profile?.name
}

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
      return '$icon'
    case LogLevelEnum.Warning:
      return '$warning'
    case LogLevelEnum.Error:
      return '$error'
      return
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
