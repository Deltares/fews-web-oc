<template>
  <v-data-iterator :items="logMessages">
    <template v-slot:default="{ items }">
      <v-row>
        <v-col v-for="(log, index) in items" :key="index" cols="12">
          <v-card class="mb-4" outlined>
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
  </v-data-iterator>
</template>

<script setup lang="ts">
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

const logMessages: LogMessage[] = [
  {
    user: 'Anne Markensteijn',
    timestamp: new Date('2024-11-01T10:15:00Z').toISOString(),
    level: LogLevelEnum.Info,
    message: 'Shift Ended. Just a regular day.',
  },
  {
    user: 'Jane Doe',
    timestamp: new Date('2024-11-01T12:30:00Z').toISOString(),
    level: LogLevelEnum.Warning,
    message: 'This is definitely cause for a warning.',
  },
]
</script>
