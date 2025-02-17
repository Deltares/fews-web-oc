<template>
  <div>
    <v-card
      :class="
        isLogMessageByCurrentUser(log, userName)
          ? 'current-user-message'
          : 'other-message'
      "
      border
      flat
      density="compact"
    >
      <template #title>
        <div class="d-flex align-center ga-2">
          <v-list-item-title :style="{ color: logToUserColor(log, userName) }">
            {{ logToUser(log, userName) }}
          </v-list-item-title>
          <v-card-subtitle class="align-self-end">{{
            toHumanReadableDate(log.entryTime)
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
          <template v-for="dissemination in logToActions(log, disseminations)">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  :icon="dissemination.iconId"
                  variant="plain"
                  size="small"
                  v-bind="props"
                  @click="emit('disseminateLog', log, dissemination)"
                />
              </template>
              <span>{{ dissemination.description }}</span>
            </v-tooltip>
          </template>
        </div>
      </template>
      <v-card-text>
        <div class="d-flex">
          <span> {{ log.text }} </span>
          <v-spacer />
          <slot name="actions"></slot>
        </div>
      </v-card-text>
      <template #append>
        <v-icon
          v-if="logToIcon(log)"
          size="small"
          :icon="logToIcon(log)"
          :color="logToColor(log)"
        />
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { toHumanReadableDate } from '@/lib/date'
import {
  isLogMessageByCurrentUser,
  logToIcon,
  logToUser,
  logToUserColor,
  logToColor,
  logToRoute,
  logToActions,
  type LogMessage,
} from '@/lib/log'
import type { LogDisplayDisseminationAction } from '@deltares/fews-pi-requests'

interface Props {
  log: LogMessage
  userName: string
  disseminations: LogDisplayDisseminationAction[]
}

defineProps<Props>()

const emit = defineEmits(['disseminateLog'])
</script>
