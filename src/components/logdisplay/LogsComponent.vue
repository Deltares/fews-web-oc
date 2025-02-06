<template>
  <div class="d-flex flex-column w-100 h-100">
    <div class="flex-0-0 d-flex ga-2 align-center pa-2">
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
        v-model="selectedLogTypes"
        :items="logTypes"
        label="Filter by Log Type"
        variant="outlined"
        clearable
        hide-details
        multiple
        max-width="200px"
        density="compact"
        :item-title="toTitleCase"
        :item-value="(item) => item"
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
        :item-title="toTitleCase"
        :item-value="(item) => item"
      />
      <v-text-field
        v-model.number="maxCount"
        label="Request count"
        variant="outlined"
        hide-details
        max-width="125px"
        density="compact"
        validate-on="input"
        :max="1000"
        :min="1"
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
      <span>Total: {{ filteredLogMessages.length }}</span>
    </div>

    <v-virtual-scroll
      class="scroll-container px-2"
      :items="filteredLogMessages"
    >
      <template #default="{ item: log }">
        <v-col
          :class="{
            'ml-auto': isLogMessageByCurrentUser(log, userName),
            'mr-auto': !isLogMessageByCurrentUser(log, userName),
          }"
          cols="8"
          class="pa-0"
        >
          <v-card
            :class="{
              'current-user-message': isLogMessageByCurrentUser(log, userName),
              'other-message': !isLogMessageByCurrentUser(log, userName),
            }"
            :color="logToColor(log, userName)"
            class="mb-4"
            border
            flat
          >
            <template #prepend>
              <v-icon size="small" :icon="logToUserIcon(log)" />
            </template>
            <template #title>
              <div class="d-flex align-center ga-2">
                <div class="font-weight-bold">
                  {{ logToUser(log, userName) }}
                </div>
                <v-card-subtitle class="align-self-end">{{
                  log.entryTime
                }}</v-card-subtitle>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-if="log.topologyNodeId"
                      :to="logToRoute(log)"
                      density="compact"
                      icon="mdi-link-variant"
                      variant="plain"
                      size="small"
                      v-bind="props"
                    />
                  </template>
                  <span>Go to node</span>
                </v-tooltip>
                <template
                  v-for="dissemination in logToActions(log, disseminations)"
                >
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-btn
                        density="compact"
                        :icon="dissemination.iconId"
                        variant="plain"
                        size="small"
                        v-bind="props"
                        @click="disseminateLog(log, dissemination)"
                      />
                    </template>
                    <span>{{ dissemination.description }}</span>
                  </v-tooltip>
                </template>
              </div>
            </template>
            <v-card-text>
              {{ log.text }}
            </v-card-text>
            <template #append>
              <v-icon
                v-if="logToIcon(log)"
                size="small"
                :icon="logToIcon(log)"
              />
            </template>
          </v-card>
        </v-col>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  type LogType,
  type LogLevel,
  logLevels,
  filterLog,
  isLogMessageByCurrentUser,
  logToIcon,
  logToUserIcon,
  logToUser,
  logToColor,
  logToRoute,
  logToActions,
  getSystemFilters,
  getManualFilters,
  logTypes,
  toTitleCase,
  LogMessage,
} from '@/lib/log'
import {
  LogDisplayDisseminationAction,
  type LogDisplayLogsFilter,
  type LogsDisplay,
} from '@deltares/fews-pi-requests'
import { useLogDisplayLogs } from '@/services/useLogDisplayLogs'
import { configManager } from '@/services/application-config'
import { debouncedRef } from '@vueuse/core'
import { useCurrentUser } from '@/services/useCurrentUser'

interface Props {
  logDisplay: LogsDisplay
}

const props = defineProps<Props>()

const newMessageDialog = ref(false)
const newLogLevel = ref<LogLevel>('INFO')
const newLogMessage = ref('')

const search = ref<string>()
const maxCount = ref<number>(250)
const selectedLevels = ref<LogLevel[]>([])
const selectedLogTypes = ref<LogType[]>([])

const { userName } = useCurrentUser()

const filters = computed(() => {
  const baseFilter: LogDisplayLogsFilter = {
    logDisplayId: props.logDisplay.id,
    maxCount: maxCount.value,
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

const requestDebounce = 500
const debouncedFilters = debouncedRef(filters, requestDebounce)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { logMessages } = useLogDisplayLogs(baseUrl, debouncedFilters)

const filterDebounce = 100
const debouncedSelectedLevels = debouncedRef(selectedLevels, filterDebounce)
const debouncedSelectedLogTypes = debouncedRef(selectedLogTypes, filterDebounce)
const debouncedSearch = debouncedRef(search, filterDebounce)

const filteredLogMessages = computed(() =>
  logMessages.value.filter((log) =>
    filterLog(
      log,
      debouncedSelectedLevels.value,
      debouncedSelectedLogTypes.value,
      debouncedSearch.value,
    ),
  ),
)

const disseminations = computed(() => {
  return props.logDisplay.logDissemination
    ? props.logDisplay.logDissemination.disseminationActions
    : []
})

function disseminateLog(
  log: LogMessage,
  dissemination: LogDisplayDisseminationAction,
) {
  console.log('Disseminating log', log, dissemination)
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
  height: 100%;
  overflow-y: auto;
  width: 100%;
}

.date-iterator-container > :not([class]) {
  height: 100%;
}
</style>
