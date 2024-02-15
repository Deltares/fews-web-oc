<template>
  <div class="info-panel">
  <v-menu>
  <template v-slot:activator="{ props }">
      <v-icon class="info-icon">mdi-information</v-icon>
      <v-btn v-bind="props">
        <span class="layer-title">{{ layerTitle }}</span> 
        <span class="current-time">{{ formattedCurrentTime }}</span>
      </v-btn>
  </template>
    <v-list>
      <v-list-item 
      :title="props.layerTitle"
      :subtitle="analysisTime"
      >
      </v-list-item>
    </v-list>
  </v-menu>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon';

interface Props {
  layerTitle: string
  currentTime: Date | null
  forecastTime: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
  time: null,
})

// add derived prop time string
const analysisTime = computed(() => {
  if (!props.forecastTime) return ''
  return "Analysetijd: " + props.forecastTime.toLocaleString()
})

const formattedCurrentTime = computed(() => {
  if (!props.currentTime) return ''
  const format = 'HH:mm ZZZZ'
  const timeZone = 'Europe/Amsterdam'
  const dateTime = DateTime.fromJSDate(props.currentTime).setZone(timeZone).setLocale('nl-NL');
  return dateTime.toFormat(format)
})
</script>


<style scoped>
.info-panel {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  top: 8px;
  right: 10px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
}

.info-icon {
  margin-right: 8px; 
  margin-left: 8px;
}
.layer-title {
  font-weight: bold;
}

.current-time {
  margin-left: 10px;
  padding: 0 10px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
}
</style>